import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  QuerySnapshot,
  DocumentData,
  orderBy,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { WorkflowRequest } from '../Models/WorkflowModel';
import { StockService } from './stock.service';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly topicName = 'workflow_requests';

  constructor(private _stockService: StockService) {}
  /* ---------- Create a new request ---------------- */
  async createRequest(partial: {
    moduleId: string;
    requestType: 'StockIn' | 'StockOut';
    requestedBy: string;
    remarks?: string;
  }): Promise<string> {
    const payload: WorkflowRequest = {
      ...partial,
      status: 'Pending',
      requestedOn: new Date(),
    };
    const ref = await addDoc(collection(firestore, this.topicName), payload);
    return ref.id;
  }

  /* ---------- Fetch all pending requests ---------- */
  async getPending(): Promise<WorkflowRequest[]> {
    const q = query(collection(firestore, this.topicName), where('status', '==', 'Pending'));
    const snap = await getDocs(q);
    return this.mapSnapshot(snap);
  }
  async getWKFRequests(): Promise<WorkflowRequest[]> {
    const q = query(collection(firestore, this.topicName), orderBy('requestedOn', 'desc'));

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        requestId: doc.id,
        moduleId: data['moduleId'] || '',
        requestType: data['requestType'] || '',
        status: data['status'] || '',
        requestedBy: data['requestedBy'] || '',
        requestedOn: data['requestedOn']?.toDate?.() ?? new Date(),
        approvedBy: data['approvedBy'] || '',
        approvedOn: data['approvedOn']?.toDate?.() ?? new Date(),
        remarks: data['remarks'] || '',
      };
    });
  }

  /* ---------- Approve a request ------------------- */
  async approve(
    requestId: string,
    moduleid: string,
    branchid: string,
    approver: string,
    requestType: string,
    remarks: string = '',
  ): Promise<void> {
    this.MarkRequestDetails(moduleid, branchid, requestType, 'Approved');
    const ref = doc(firestore, this.topicName, requestId);
    await updateDoc(ref, {
      status: 'Approved',
      approvedBy: approver,
      approvedOn: Timestamp.now(),
      remarks,
    });
  }

  /* ---------- Reject a request -------------------- */
  async reject(
    requestId: string,
    moduleid: string,
    branchid: string,
    approver: string,
    requestType: string,
    remarks: string = '',
  ): Promise<void> {
    this.MarkRequestDetails(moduleid, branchid, requestType, 'Rejected');
    const ref = doc(firestore, this.topicName, requestId);
    await updateDoc(ref, {
      status: 'Rejected',
      approvedBy: approver,
      approvedOn: Timestamp.now(),
      remarks,
    });
  }
  MarkRequestDetails(moduleid: string, branchid: string, requestType: string, status: string) {
    switch (requestType) {
      case 'StockIn':
      case 'StockOut':
        this._stockService.MarkRequestDetails(moduleid, branchid, status);
    }
  }

  /* ---------- Get request by ID ------------------- */
  async getById(requestId: string): Promise<WorkflowRequest | null> {
    const snap = await getDoc(doc(firestore, this.topicName, requestId));
    return snap.exists() ? (this.mapDoc(snap.data(), snap.id) as WorkflowRequest) : null;
  }

  /* ---------- Helpers ----------------------------- */
  private mapSnapshot(snap: QuerySnapshot<DocumentData>): WorkflowRequest[] {
    return snap.docs.map((d) => this.mapDoc(d.data(), d.id));
  }

  private mapDoc(data: any, id: string): WorkflowRequest {
    return {
      requestId: id,
      moduleId: data.moduleId,
      requestType: data.requestType,
      status: data.status,
      requestedBy: data.requestedBy,
      requestedOn: (data.requestedOn?.toDate?.() || new Date()) as Date,
      approvedBy: data.approvedBy,
      approvedOn: data.approvedOn?.toDate?.(),
      remarks: data.remarks || '',
    };
  }
}
