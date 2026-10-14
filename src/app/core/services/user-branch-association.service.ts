import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../firebase-config';

export const ALL_BRANCHES_ID = '0';

export interface UserBranchAssociation {
  id?: string;
  userid: string;
  branchid: string;
  userName?: string;
  branchName?: string;
}

@Injectable({ providedIn: 'root' })
export class UserBranchAssociationService {
  private readonly topicName = 'UserBranchAssociations';

  async getAssociations(): Promise<UserBranchAssociation[]> {
    const snapshot = await getDocs(collection(firestore, this.topicName));
    return snapshot.docs.map((item) => this.mapAssociation(item.id, item.data()));
  }

  async getByUser(userid: string): Promise<UserBranchAssociation[]> {
    const snapshot = await getDocs(
      query(collection(firestore, this.topicName), where('userid', '==', userid)),
    );
    return snapshot.docs.map((item) => this.mapAssociation(item.id, item.data()));
  }

  async associate(userid: string, branchid: string): Promise<void> {
    const existing = await this.getByUser(userid);
    if (existing.some((item) => item.branchid === branchid)) {
      return;
    }
    if (branchid === ALL_BRANCHES_ID) {
      await Promise.all(existing.map((item) => this.disassociate(item.id || '')));
    } else {
      const allBranches = existing.find((item) => item.branchid === ALL_BRANCHES_ID);
      if (allBranches?.id) {
        await this.disassociate(allBranches.id);
      }
    }
    await addDoc(collection(firestore, this.topicName), { userid, branchid });
  }

  async disassociate(associationId: string): Promise<void> {
    if (!associationId) {
      return;
    }
    await deleteDoc(doc(firestore, this.topicName, associationId));
  }

  private mapAssociation(id: string, data: Record<string, unknown>): UserBranchAssociation {
    return {
      id,
      userid: String(data['userid'] || ''),
      branchid: String(data['branchid'] ?? ''),
    };
  }
}
