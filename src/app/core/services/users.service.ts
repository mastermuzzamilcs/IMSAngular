import { Injectable } from '@angular/core';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { User } from '../Models/UsersModel';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor() {}
  private readonly topicName: string = 'Users';

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
        status: data['status'] || '',
      };
    });
  }

  async addUser(_user: User): Promise<void> {
    const branchRef = collection(firestore, this.topicName);
    await addDoc(branchRef, _user);
  }

  async updateUser(_user: User): Promise<void> {
    if (!_user.userid) {
      console.error('Branch ID is required for updating the branch.');
      return;
    }

    const branchRef = doc(firestore, this.topicName, _user.userid);
    await setDoc(branchRef, _user);
  }

  async deleteUser(_userid: string): Promise<void> {
    const branchRef = doc(firestore, this.topicName, _userid);
    await deleteDoc(branchRef);
  }

  async getUsersByRole(roleId: string): Promise<User[]> {
    const usersRef = collection(firestore, this.topicName);
    const q = query(usersRef, where('role', '==', roleId), where('status', '==', 'active'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userid: doc.id,
        name: data['name'],
        email: data['email'],
        roleid: data['roleid'],
        role: '',
        manager: data['manager'],
        branchid: data['branch'],
        branch: '',
        status: data['status'],
      };
    });
  }
}
