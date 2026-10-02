import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
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
import { RequestStatus, RequestType, WorkflowRequest } from '../Models/WorkflowModel';
import { WorkflowExecutor } from '../workflow/workflow-executor';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly topicName = 'workflow_requests';

  constructor(private executor: WorkflowExecutor) {}
  /* ---------- Create a new request ---------------- */
  async createRequest(partial: {
    moduleId: string;
    requestType: WorkflowRequest['requestType'];
    requestedBy: string;
    remarks?: string;
  }): Promise<string> {
    const payload: WorkflowRequest = {
      ...partial,
      status: RequestStatus.Pending,
      requestedOn: new Date(),
    };
    const ref = await addDoc(collection(firestore, this.topicName), payload);
    try {
      await this.executor.run(
        { ...payload, requestId: ref.id },
        RequestStatus.Pending,
        payload.remarks || '',
        payload.requestedBy,
      );
    } catch (error) {
      await deleteDoc(ref);
      throw error;
    }
    return ref.id;
  }

  /* ---------- Fetch all pending requests ---------- */
  async getPending(): Promise<WorkflowRequest[]> {
    const q = query(
      collection(firestore, this.topicName),
      where('status', '==', RequestStatus.Pending),
    );
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
        requestType: (data['requestType'] || '') as RequestType,
        status: (data['status'] || '') as RequestStatus,
        requestedBy: data['requestedBy'] || '',
        requestedOn: data['requestedOn']?.toDate?.() ?? new Date(),
        approvedBy: data['approvedBy'] || '',
        approvedOn: data['approvedOn']?.toDate?.() ?? new Date(),
        remarks: data['remarks'] || '',
      };
    });
  }

  async findByModule(moduleId: string, requestType: RequestType): Promise<WorkflowRequest | null> {
    const q = query(collection(firestore, this.topicName), where('moduleId', '==', moduleId));
    const snap = await getDocs(q);
    const match = snap.docs.find((item) => item.data()['requestType'] === requestType);
    return match ? this.mapDoc(match.data(), match.id) : null;
  }

  async recordStatus(
    requestId: string,
    status: RequestStatus,
    approver: string,
    remarks: string = '',
  ): Promise<void> {
    await updateDoc(doc(firestore, this.topicName, requestId), {
      status,
      approvedBy: approver,
      approvedOn: Timestamp.now(),
      remarks,
    });
  }

  async updateStatus(
    requestId: string,
    status: RequestStatus,
    approver: string,
    remarks: string = '',
  ): Promise<void> {
    const ref = doc(firestore, this.topicName, requestId);
    await updateDoc(ref, {
      status,
      approvedBy: approver,
      approvedOn: Timestamp.now(),
      remarks,
    });
    const request = await this.getById(requestId);
    if (request) {
      await this.executor.run(request, status, remarks, approver);
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
