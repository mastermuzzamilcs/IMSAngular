import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { asStatus } from '../enums/status.enum';
import { UserGroup } from '../Models/UserGroupModel';

@Injectable({ providedIn: 'root' })
export class UserGroupService {
  private readonly topicName = 'UserGroups';
  private cachedGroups: UserGroup[] | null = null;

  async getGroups(forceRefresh = false): Promise<UserGroup[]> {
    if (this.cachedGroups && !forceRefresh) {
      return this.cachedGroups;
    }
    const snapshot = await getDocs(collection(firestore, this.topicName));
    this.cachedGroups = snapshot.docs.map((item) => this.mapGroup(item.id, item.data()));
    return this.cachedGroups;
  }

  async addGroup(group: UserGroup): Promise<void> {
    await addDoc(collection(firestore, this.topicName), this.payload(group));
    this.cachedGroups = null;
  }

  async updateGroup(group: UserGroup): Promise<void> {
    if (!group.id) {
      return;
    }
    await setDoc(doc(firestore, this.topicName, group.id), this.payload(group));
    this.cachedGroups = null;
  }

  async deleteGroup(groupId: string): Promise<void> {
    await deleteDoc(doc(firestore, this.topicName, groupId));
    this.cachedGroups = null;
  }

  private payload(group: UserGroup) {
    return {
      name: group.name?.trim() || '',
      description: group.description?.trim() || '',
      status: asStatus(group.status),
      canApprove: !!group.canApprove,
    };
  }

  private mapGroup(id: string, data: Record<string, unknown>): UserGroup {
    return {
      id,
      name: String(data['name'] || ''),
      description: String(data['description'] || ''),
      status: asStatus(data['status']),
      canApprove: !!data['canApprove'],
    };
  }
}
