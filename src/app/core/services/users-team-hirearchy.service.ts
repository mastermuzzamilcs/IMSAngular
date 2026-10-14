import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';

export interface Users_team_hirearchy {
  id?: string;
  userid: string;
  reportingTo: string;
  userName?: string;
  reportingToName?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersTeamHirearchyService {
  private readonly topicName = 'Users_team_hirearchy';

  async getAll(): Promise<Users_team_hirearchy[]> {
    const snapshot = await getDocs(collection(firestore, this.topicName));
    return snapshot.docs.map((item) => this.map(item.id, item.data()));
  }

  async save(userid: string, reportingTo: string): Promise<void> {
    if (!userid || !reportingTo || userid === reportingTo) {
      throw new Error('Choose two different users');
    }
    const snapshot = await getDocs(
      query(collection(firestore, this.topicName), where('userid', '==', userid)),
    );
    if (snapshot.empty) {
      await addDoc(collection(firestore, this.topicName), { userid, reportingTo });
      return;
    }
    await updateDoc(snapshot.docs[0].ref, { reportingTo });
  }

  async remove(id: string): Promise<void> {
    if (!id) {
      return;
    }
    await deleteDoc(doc(firestore, this.topicName, id));
  }

  private map(id: string, data: Record<string, unknown>): Users_team_hirearchy {
    return {
      id,
      userid: String(data['userid'] || ''),
      reportingTo: String(data['reportingTo'] || ''),
    };
  }
}
