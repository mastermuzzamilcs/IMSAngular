import { Injectable } from '@angular/core';
import { collection, addDoc, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { Role } from '../Models/RoleModel';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor() {}
  private readonly topicName: string = 'UserRoles';
  private cachedRoles: Role[] | null = null;

  async getRoles(forceRefresh: boolean = false): Promise<Role[]> {
    if (this.cachedRoles && !forceRefresh) {
      return this.cachedRoles;
    }
    const querySnapshot = await getDocs(collection(firestore, this.topicName));
    this.cachedRoles = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data['name'] || '',
        description: data['description'] || '',
        status: data['status'] || '',
      };
    });
    return this.cachedRoles;
  }

  async addRole(_role: Role): Promise<void> {
    const branchRef = collection(firestore, this.topicName);
    await addDoc(branchRef, _role);
    this.cachedRoles = null;
  }

  async updateRole(_role: Role): Promise<void> {
    if (!_role.id) {
      console.error('Branch ID is required for updating the branch.');
      return;
    }

    const branchRef = doc(firestore, this.topicName, _role.id);
    await setDoc(branchRef, _role);
    this.cachedRoles = null;
  }

  async deleteRole(_role: string): Promise<void> {
    const branchRef = doc(firestore, this.topicName, _role);
    await deleteDoc(branchRef);
    this.cachedRoles = null;
  }
}
