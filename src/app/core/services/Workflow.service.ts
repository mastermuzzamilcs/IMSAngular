import { Injectable, inject } from '@angular/core';
import {
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
  runTransaction,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { firestoreDoc } from '../firebase/firestore-write';
import { RequestStatus, RequestType, WorkflowRequest } from '../Models/WorkflowModel';
import { SYSTEM_USER_ID } from '../system-user';
import { WorkflowExecutor } from '../workflow/workflow-executor';
import { RequestAssigneeService } from './request-assignee.service';
import { RequestTypeService } from './request-type.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private readonly toast = inject(ToastService);
  private readonly topicName = 'workflow_requests';

  constructor(
    private executor: WorkflowExecutor,
    private requestTypeService: RequestTypeService,
    private assigneeService: RequestAssigneeService,
  ) {}
  /* ---------- Create a new request ---------------- */
  async createRequest(partial: {
    moduleId: string;
    requestType: WorkflowRequest['requestType'];
    requestedBy: string;
    remarks?: string;
    branchId?: string;
    toBranchId?: string;
  }): Promise<string> {
    const draft: WorkflowRequest = {
      ...partial,
      assignedTo: '',
      toBranchId: partial.requestType === RequestType.Transfer ? partial.toBranchId || '' : '',
      status: RequestStatus.Pending,
      requestedOn: new Date(),
    };
    const assignedTo = await this.resolveAssignedTo(draft);
    const payload: WorkflowRequest = { ...draft, assignedTo };
    const ref = doc(collection(firestore, this.topicName));
    const year = new Date().getFullYear();
    const counterRef = doc(firestore, 'SystemCounters', `request-${year}`);
    const autoApprovePromise = this.requestTypeService.isAutoApprove(partial.requestType);
    await runTransaction(firestore, async (transaction) => {
      const counter = await transaction.get(counterRef);
      const nextNumber = Number(counter.data()?.['nextNumber'] || 0) + 1;
      const requestNumber = `REQ-${year}-${String(nextNumber).padStart(6, '0')}`;
      transaction.set(counterRef, { nextNumber }, { merge: true });
      transaction.set(
        ref,
        firestoreDoc({ ...(payload as unknown as Record<string, unknown>), requestNumber }),
      );
      payload.requestNumber = requestNumber;
    });
    const request = { ...payload, requestId: ref.id };
    this.runFollowUpInBackground(
      this.processCreatedRequest(
        ref.id,
        request,
        autoApprovePromise,
        partial.remarks || 'Auto approved',
      ),
      'Request was created, but one or more follow-up actions failed.',
    );
    return ref.id;
  }

  private async processCreatedRequest(
    requestId: string,
    request: WorkflowRequest,
    autoApprovePromise: Promise<boolean>,
    autoApproveRemarks: string,
  ): Promise<void> {
    try {
      if (await autoApprovePromise) {
        await this.completeAutoApproval(requestId, request, autoApproveRemarks);
        return;
      }
      await this.executor.run(
        request,
        RequestStatus.Pending,
        request.remarks || '',
        request.requestedBy,
      );
    } catch (error) {
      console.error('Request follow-up actions failed', error);
      this.toast.error(
        error instanceof Error
          ? `Request was created, but a follow-up action failed. ${error.message}`
          : 'Request was created, but a follow-up action failed.',
      );
    }
  }

  private async completeAutoApproval(
    requestId: string,
    request: WorkflowRequest,
    remarks: string,
  ): Promise<void> {
    await this.executor.run(
      request,
      RequestStatus.Pending,
      request.remarks || '',
      request.requestedBy,
    );
    await this.updateStatus(requestId, RequestStatus.Approved, SYSTEM_USER_ID, remarks);
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

    return querySnapshot.docs.map((docSnap) => this.mapDoc(docSnap.data(), docSnap.id));
  }

  async getForBranch(branchId: string): Promise<WorkflowRequest[]> {
    const requests = await this.getWKFRequests();
    if (!branchId) {
      return [];
    }
    const needsLookup = requests.some((request) => !this.hasStoredBranch(request));
    const index = needsLookup ? await this.branchIndex() : null;
    return requests
      .map((request) => this.withResolvedBranches(request, index))
      .filter((request) => this.belongsToBranch(request, branchId, index));
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
    const request = await this.getById(requestId);
    if (request) {
      await this.assertCanAct(request, approver);
    }
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
    waitForFollowUpActions = true,
  ): Promise<void> {
    const current = await this.getById(requestId);
    if (!current) {
      throw new Error('Request was not found');
    }
    await this.assertCanAct(current, approver);
    const ref = doc(firestore, this.topicName, requestId);
    await updateDoc(ref, {
      status,
      approvedBy: approver,
      approvedOn: Timestamp.now(),
      remarks,
    });
    const followUp = this.executor.run(
      { ...current, status, approvedBy: approver, approvedOn: new Date(), remarks },
      status,
      remarks,
      approver,
    );
    if (waitForFollowUpActions) {
      await followUp;
    } else {
      this.runFollowUpInBackground(
        followUp,
        'Status was updated, but one or more follow-up actions failed.',
      );
    }
  }

  private runFollowUpInBackground(task: Promise<void>, failureMessage: string): void {
    void task.catch((error: unknown) => {
      console.error(failureMessage, error);
      this.toast.error(
        error instanceof Error ? `${failureMessage} ${error.message}` : failureMessage,
      );
    });
  }

  /* ---------- Get request by ID ------------------- */
  async getById(requestId: string): Promise<WorkflowRequest | null> {
    const snap = await getDoc(doc(firestore, this.topicName, requestId));
    return snap.exists() ? (this.mapDoc(snap.data(), snap.id) as WorkflowRequest) : null;
  }

  async canCurrentUserAct(request: WorkflowRequest, userId: string): Promise<boolean> {
    try {
      await this.assertCanAct(request, userId);
      return true;
    } catch {
      return false;
    }
  }

  /* ---------- Helpers ----------------------------- */
  private async resolveAssignedTo(request: WorkflowRequest): Promise<string> {
    const setting = await this.requestTypeService.getSetting(request.requestType);
    const sourceCode = (setting.assignedToSource || '').trim();
    if (!sourceCode) {
      throw new Error(
        `Request type ${request.requestType} has no Assigned to item source. Configure it under Setup → Request Types.`,
      );
    }
    const userId = await this.assigneeService.resolveFromItemSource(sourceCode, {
      request,
      status: request.status,
      remarks: request.remarks || '',
      approver: '',
    });
    if (!userId) {
      throw new Error(
        `Could not resolve Assigned to from item source ${sourceCode} for ${request.requestType}.`,
      );
    }
    return userId;
  }

  private async assertCanAct(request: WorkflowRequest, actorId: string): Promise<void> {
    if (actorId === SYSTEM_USER_ID) {
      return;
    }
    const assignedTo = (request.assignedTo || '').trim();
    if (!assignedTo) {
      throw new Error('This request has no assigned user, so no action can be taken.');
    }
    if (assignedTo !== actorId) {
      throw new Error('Only the assigned user can act on this request.');
    }
    if (!(await this.assigneeService.userCanApprove(actorId))) {
      throw new Error('Your group is not allowed to approve requests.');
    }
  }

  private mapSnapshot(snap: QuerySnapshot<DocumentData>): WorkflowRequest[] {
    return snap.docs.map((d) => this.mapDoc(d.data(), d.id));
  }

  private mapDoc(data: DocumentData, id: string): WorkflowRequest {
    const requestType = (data['requestType'] || '') as RequestType;
    return {
      requestId: id,
      requestNumber: data['requestNumber'] || '',
      moduleId: data['moduleId'],
      requestType,
      status: data['status'],
      requestedBy: data['requestedBy'],
      requestedOn: (data['requestedOn']?.toDate?.() || new Date()) as Date,
      assignedTo: data['assignedTo'] || '',
      approvedBy: data['approvedBy'],
      approvedOn: data['approvedOn']?.toDate?.(),
      remarks: data['remarks'] || '',
      branchId: data['branchId'] || '',
      toBranchId: requestType === RequestType.Transfer ? data['toBranchId'] || '' : '',
    };
  }

  private hasStoredBranch(request: WorkflowRequest): boolean {
    if (request.requestType === RequestType.Transfer) {
      return !!(request.branchId || request.toBranchId);
    }
    return !!request.branchId;
  }

  private withResolvedBranches(
    request: WorkflowRequest,
    index: { stocks: Map<string, string>; transfers: Map<string, string[]> } | null,
  ): WorkflowRequest {
    if (this.hasStoredBranch(request) || !index) {
      return request;
    }
    if (request.requestType === RequestType.Transfer) {
      const ids = index.transfers.get(request.moduleId) || [];
      const from = ids[0] || '';
      const to = ids.find((id) => id !== from) || ids[1] || '';
      return {
        ...request,
        branchId: from,
        toBranchId: to,
      };
    }
    return {
      ...request,
      branchId: index.stocks.get(request.moduleId) || '',
    };
  }

  private async branchIndex(): Promise<{
    stocks: Map<string, string>;
    transfers: Map<string, string[]>;
  }> {
    const [stockSnap, transferSnap] = await Promise.all([
      getDocs(collection(firestore, 'inventory_stocks')),
      getDocs(collection(firestore, 'Transfers')),
    ]);
    const stocks = new Map<string, string>();
    stockSnap.docs.forEach((item) => {
      const branchId = String(item.data()['branchid'] || '');
      if (branchId) {
        stocks.set(item.id, branchId);
      }
    });
    const transfers = new Map<string, string[]>();
    transferSnap.docs.forEach((item) => {
      const data = item.data();
      const ids = [data['fromBranch'], data['branchId'], data['toBranch']]
        .map((value) => String(value || ''))
        .filter((value) => value.length > 0);
      transfers.set(item.id, [...new Set(ids)]);
    });
    return { stocks, transfers };
  }

  private belongsToBranch(
    request: WorkflowRequest,
    branchId: string,
    index: { stocks: Map<string, string>; transfers: Map<string, string[]> } | null,
  ): boolean {
    if (request.requestType === RequestType.Transfer) {
      if (request.branchId || request.toBranchId) {
        return request.branchId === branchId || request.toBranchId === branchId;
      }
      if (!index) {
        return false;
      }
      return (index.transfers.get(request.moduleId) || []).includes(branchId);
    }

    if (request.branchId) {
      return request.branchId === branchId;
    }
    if (!index) {
      return false;
    }
    return index.stocks.get(request.moduleId) === branchId;
  }
}
