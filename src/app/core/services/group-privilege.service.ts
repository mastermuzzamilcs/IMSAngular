import { Injectable } from '@angular/core';
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { PrivilegeRef } from '../auth/privilege-catalog';

export interface GroupPrivilege extends PrivilegeRef {
  id?: string;
  groupid: string;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class GroupPrivilegeService {
  private readonly topicName = 'UserGroupPrivileges';

  async getEnabledForGroups(groupIds: string[]): Promise<GroupPrivilege[]> {
    if (!groupIds.length) {
      return [];
    }
    const owned = new Set(groupIds);
    const grants = await this.getAll();
    return grants.filter((item) => item.enabled && owned.has(item.groupid));
  }

  async getForGroup(groupId: string): Promise<GroupPrivilege[]> {
    const snapshot = await getDocs(
      query(collection(firestore, this.topicName), where('groupid', '==', groupId)),
    );
    return snapshot.docs.map((item) => this.mapGrant(item.id, item.data()));
  }

  async saveGroup(groupId: string, selected: PrivilegeRef[]): Promise<void> {
    const existing = await getDocs(
      query(collection(firestore, this.topicName), where('groupid', '==', groupId)),
    );
    if (existing.empty && selected.length === 0) {
      return;
    }
    const batch = writeBatch(firestore);
    existing.docs.forEach((item) => batch.delete(item.ref));
    selected.forEach((item) => {
      const ref = doc(collection(firestore, this.topicName));
      batch.set(ref, {
        groupid: groupId,
        applicationId: item.applicationId,
        moduleId: item.moduleId,
        functionId: item.functionId,
        enabled: true,
      });
    });
    await batch.commit();
  }

  private async getAll(): Promise<GroupPrivilege[]> {
    const snapshot = await getDocs(collection(firestore, this.topicName));
    return snapshot.docs.map((item) => this.mapGrant(item.id, item.data()));
  }

  private mapGrant(id: string, data: Record<string, unknown>): GroupPrivilege {
    return {
      id,
      groupid: String(data['groupid'] || ''),
      applicationId: Number(data['applicationId']) as PrivilegeRef['applicationId'],
      moduleId: Number(data['moduleId']) as PrivilegeRef['moduleId'],
      functionId: Number(data['functionId']) as PrivilegeRef['functionId'],
      enabled: data['enabled'] !== false,
    };
  }
}
