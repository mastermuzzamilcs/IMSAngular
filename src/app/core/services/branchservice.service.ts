import { Injectable } from '@angular/core';
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config'; // Import Firestore config
import { Branch } from '../Models/BranchModel'; // Define Branch model

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  constructor() {}
  private readonly topicName: string = 'Branches';
  private cachedBranches: Branch[] | null = null;

  async getBranches(forceRefresh: boolean = false): Promise<Branch[]> {
    if (this.cachedBranches && !forceRefresh) {
      return this.cachedBranches;
    }
    const querySnapshot = await getDocs(collection(firestore, this.topicName));
    this.cachedBranches = querySnapshot.docs.map((doc) => {
      const data = doc.data() as Branch;
      return {
        branchid: doc.id,
        name: data.name,
        location: data.location,
        address: data.address,
        email: data.email,
        managerid: data.manager,
        manager: '',
        contact: data.contact,
        status: data.status,
      };
    });

    return this.cachedBranches;
  }

  async addBranch(branch: Branch): Promise<void> {
    const branchRef = collection(firestore, this.topicName);
    await addDoc(branchRef, branch);
    this.cachedBranches = null;
  }

  async updateBranch(branch: Branch): Promise<void> {
    if (!branch.branchid) {
      console.error('Branch ID is required for updating the branch.');
      return;
    }

    const branchRef = doc(firestore, this.topicName, branch.branchid);
    await setDoc(branchRef, branch);
    this.cachedBranches = null;
  }

  async deleteBranch(branchId: string): Promise<void> {
    const branchRef = doc(firestore, this.topicName, branchId);
    await deleteDoc(branchRef);
    this.cachedBranches = null;
  }
  async getBranchById(id: string): Promise<Branch | null> {
    const snap = await getDoc(doc(firestore, this.topicName, id));
    return snap.exists() ? ({ branchid: snap.id, ...snap.data() } as Branch) : null;
  }
}
