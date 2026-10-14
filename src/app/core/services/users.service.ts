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
import { asStatus, isStatus, Status } from '../enums/status.enum';
import { User } from '../Models/UsersModel';
import { SYSTEM_USER_ID, SYSTEM_USER_NAME } from '../system-user';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor() {}
  private readonly topicName: string = 'Users';

  async ensureSystemUser(): Promise<void> {
    const ref = doc(firestore, this.topicName, SYSTEM_USER_ID);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      return;
    }
    await setDoc(ref, {
      name: SYSTEM_USER_NAME,
      email: 'system@ims.local',
      role: '',
      manager: '',
      branch: '',
      status: Status.Active,
      passwordHash: '',
    });
  }

  async getUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(firestore, this.topicName));
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userid: doc.id,
        name: data['name'] || '',
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

  async searchUsers(name?: string, email?: string): Promise<User[]> {
    const users = await this.getUsers();
    const nameFilter = name?.trim().toLowerCase() || '';
    const emailFilter = email?.trim().toLowerCase() || '';
    return users.filter((user) => {
      const matchesName = !nameFilter || user.name.toLowerCase().includes(nameFilter);
      const matchesEmail = !emailFilter || user.email.toLowerCase().includes(emailFilter);
      return matchesName && matchesEmail;
    });
  }

  async addUser(_user: User): Promise<void> {
    const password = _user.password?.trim() || '';
    if (!password) {
      throw new Error('A password is required for a new user.');
    }
    await addDoc(collection(firestore, this.topicName), {
      ...this.storedFields(_user),
      passwordHash: await hashPassword(password),
    });
  }

  async updateUser(_user: User): Promise<void> {
    if (!_user.userid) {
      console.error('User ID is required for updating the user.');
      return;
    }
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
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return null;
    }
    const snapshot = await getDocs(collection(firestore, this.topicName));
    const match = snapshot.docs.find(
      (item) =>
        String(item.data()['email'] || '')
          .trim()
          .toLowerCase() === normalizedEmail,
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
