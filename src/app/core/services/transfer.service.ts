import { Injectable } from '@angular/core';
import { collection, addDoc, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { Transfer } from '../Models/TransferModel';
@Injectable({
  providedIn: 'root',
})
export class TransferService {
  private readonly topicName = 'Transfers';
  constructor() {}
  async getTransfers(): Promise<Transfer[]> {
    const snapshot = await getDocs(collection(firestore, this.topicName));
    return snapshot.docs.map((document) => {
      const data = document.data();

      return {
        id: document.id,
        ...data,
      } as Transfer;
    });
  }
  async addTransfer(transfer: Transfer): Promise<string> {
    const ref = await addDoc(collection(firestore, this.topicName), transfer);
    return ref.id;
  }
  async updateTransfer(transfer: Transfer): Promise<void> {
    if (!transfer.id) return;
    await setDoc(doc(firestore, this.topicName, transfer.id), transfer);
  }
  async getTransferById(id: string) {
    const snap = await getDoc(doc(firestore, this.topicName, id));
    if (snap.exists()) {
      const data = snap.data();

      return {
        id: snap.id,
        ...data,
      } as Transfer;
    }

    return null;
  }
}
