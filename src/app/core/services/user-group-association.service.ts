import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { UserGroupAssociation } from '../Models/UserGroupModel';

@Injectable({ providedIn: 'root' })
export class UserGroupAssociationService {
  private readonly topicName = 'UserGroupAssociations';

  async getAssociations(): Promise<UserGroupAssociation[]> {
    const snapshot = await getDocs(collection(firestore, this.topicName));
    return snapshot.docs.map((item) => this.mapAssociation(item.id, item.data()));
  }

  async getByUser(userid: string): Promise<UserGroupAssociation[]> {
    const snapshot = await getDocs(
      query(collection(firestore, this.topicName), where('userid', '==', userid)),
    );
    return snapshot.docs.map((item) => this.mapAssociation(item.id, item.data()));
  }

  async hasAny(): Promise<boolean> {
    const snapshot = await getDocs(query(collection(firestore, this.topicName), limit(1)));
    return !snapshot.empty;
  }

  async associate(userid: string, groupid: string): Promise<void> {
    const existing = await this.getByUser(userid);
    if (existing.some((item) => item.groupid === groupid)) {
      throw new Error('This user is already associated with this group');
    }
    await addDoc(collection(firestore, this.topicName), { userid, groupid });
  }

  async disassociate(associationId: string): Promise<void> {
    await deleteDoc(doc(firestore, this.topicName, associationId));
  }

  private mapAssociation(id: string, data: Record<string, unknown>): UserGroupAssociation {
    return {
      id,
      userid: String(data['userid'] || ''),
      groupid: String(data['groupid'] || ''),
    };
  }
}
