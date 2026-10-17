import { Injectable } from '@angular/core';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { hashPassword } from '../auth/password-hash';
import { isValidUsername, normalizeUsername } from '../auth/username';
import { asStatus, isStatus, Status } from '../enums/status.enum';
import { User } from '../Models/UsersModel';
import { SYSTEM_USER_ID, SYSTEM_USER_NAME } from '../system-user';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor() {}
  private readonly topicName: string = 'Users';
  private cachedUsers: User[] | null = null;
  private usersLoadedAt = 0;
  private usersLoading: Promise<User[]> | null = null;
  private readonly cacheDurationMs = 15_000;

  async ensureSystemUser(): Promise<void> {
    const ref = doc(firestore, this.topicName, SYSTEM_USER_ID);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      return;
    }
    await setDoc(ref, {
      name: SYSTEM_USER_NAME,
      username: 'system',
      email: 'system@ims.local',
      role: '',
      manager: '',
      branch: '',
      status: Status.Active,
      passwordHash: '',
    });
  }

  async getUsers(forceRefresh = false): Promise<User[]> {
    if (
      !forceRefresh &&
      this.cachedUsers &&
      Date.now() - this.usersLoadedAt < this.cacheDurationMs
    ) {
      return this.cachedUsers;
    }
    if (this.usersLoading) return this.usersLoading;
    this.usersLoading = this.fetchUsers();
    try {
      this.cachedUsers = await this.usersLoading;
      this.usersLoadedAt = Date.now();
      return this.cachedUsers;
    } finally {
      this.usersLoading = null;
    }
  }

  private async fetchUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(firestore, this.topicName));
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userid: doc.id,
        name: data['name'] || '',
        username: data['username'] || '',
        email: data['email'] || '',
        roleid: data['role'] || '',
        role: '',
        manager: data['manager'] || '',
        branchid: data['branch'] || '',
        branch: '',
        status: asStatus(data['status']),
      };
    });
  }

  async getUserById(userId: string): Promise<User | null> {
    if (!userId) return null;
    const snapshot = await getDoc(doc(firestore, this.topicName, userId));
    return snapshot.exists() ? this.mapUser(snapshot.id, snapshot.data()) : null;
  }

  async searchUsers(name?: string, email?: string, username?: string): Promise<User[]> {
    const users = await this.getUsers();
    const nameFilter = name?.trim().toLowerCase() || '';
    const emailFilter = email?.trim().toLowerCase() || '';
    const usernameFilter = username?.trim().toLowerCase() || '';
    return users.filter((user) => {
      const matchesName = !nameFilter || user.name.toLowerCase().includes(nameFilter);
      const matchesEmail = !emailFilter || user.email.toLowerCase().includes(emailFilter);
      const matchesUsername =
        !usernameFilter || (user.username || '').toLowerCase().includes(usernameFilter);
      return matchesName && matchesEmail && matchesUsername;
    });
  }

  /** True when another user (not excludeUserId) already has this username. Case-insensitive. */
  async isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
    const wanted = normalizeUsername(username);
    if (!wanted) {
      return false;
    }
    const snapshot = await getDocs(collection(firestore, this.topicName));
    return snapshot.docs.some(
      (item) =>
        item.id !== excludeUserId &&
        normalizeUsername(String(item.data()['username'] || '')) === wanted,
    );
  }

  private async assertUsernameUsable(username: string, excludeUserId?: string): Promise<void> {
    if (!username?.trim()) {
      throw new Error('Username is required.');
    }
    if (!isValidUsername(username)) {
      throw new Error(
        'Username must be 3-30 characters: letters, numbers, dot, underscore or hyphen.',
      );
    }
    if (await this.isUsernameTaken(username, excludeUserId)) {
      throw new Error('This username is already taken.');
    }
  }

  async addUser(_user: User): Promise<void> {
    const password = _user.password?.trim() || '';
    if (!password) {
      throw new Error('A password is required for a new user.');
    }
    await this.assertUsernameUsable(_user.username);
    await addDoc(collection(firestore, this.topicName), {
      ...this.storedFields(_user),
      passwordHash: await hashPassword(password),
    });
    this.invalidateUsersCache();
  }

  async updateUser(_user: User): Promise<void> {
    if (!_user.userid) {
      console.error('User ID is required for updating the user.');
      return;
    }
    await this.assertUsernameUsable(_user.username, _user.userid);
    const userRef = doc(firestore, this.topicName, _user.userid);
    const existing = await getDoc(userRef);
    const password = _user.password?.trim() || '';
    const passwordHash = password
      ? await hashPassword(password)
      : String(existing.data()?.['passwordHash'] || '');
    await setDoc(userRef, {
      ...this.storedFields(_user),
      passwordHash,
    });
    this.invalidateUsersCache();
  }

  /** Sign in with an email or a username. An identifier containing '@' is treated as an email. */
  async authenticate(identifier: string, password: string): Promise<User | null> {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized || !password) {
      return null;
    }
    const field = normalized.includes('@') ? 'email' : 'username';
    const snapshot = await getDocs(collection(firestore, this.topicName));
    const match = snapshot.docs.find(
      (item) =>
        String(item.data()[field] || '')
          .trim()
          .toLowerCase() === normalized,
    );
    if (!match) {
      return null;
    }
    const data = match.data();
    if (isStatus(data['status'], Status.Inactive)) {
      return null;
    }
    const passwordHash = String(data['passwordHash'] || '');
    if (!passwordHash || passwordHash !== (await hashPassword(password))) {
      return null;
    }
    return this.mapUser(match.id, data);
  }

  async deleteUser(_userid: string): Promise<void> {
    const branchRef = doc(firestore, this.topicName, _userid);
    await deleteDoc(branchRef);
    this.invalidateUsersCache();
  }

  private invalidateUsersCache(): void {
    this.cachedUsers = null;
    this.usersLoadedAt = 0;
  }

  async getUsersByRole(roleId: string): Promise<User[]> {
    const usersRef = collection(firestore, this.topicName);
    const q = query(usersRef, where('role', '==', roleId));
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((item) => this.mapUser(item.id, item.data()))
      .filter((user) => isStatus(user.status, Status.Active));
  }

  private storedFields(user: User) {
    const source = user as User & { role?: string; branch?: string };
    return {
      name: source.name?.trim() || '',
      username: normalizeUsername(source.username),
      email: source.email?.trim() || '',
      role: source.role || source.roleid || '',
      branch: source.branch || source.branchid || '',
      status: asStatus(source.status),
    };
  }

  private mapUser(id: string, data: Record<string, unknown>): User {
    return {
      userid: id,
      name: String(data['name'] || ''),
      username: String(data['username'] || ''),
      email: String(data['email'] || ''),
      roleid: String(data['role'] || data['roleid'] || ''),
      role: '',
      manager: String(data['manager'] || ''),
      branchid: String(data['branch'] || data['branchid'] || ''),
      branch: '',
      status: asStatus(data['status']),
    };
  }
}
