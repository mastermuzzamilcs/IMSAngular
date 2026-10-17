import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  limit,
  query,
  Timestamp,
  updateDoc,
  where,
  QuerySnapshot,
  DocumentData,
  orderBy,
  runTransaction,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { RequestStatus, RequestType, WorkflowRequest } from '../Models/WorkflowModel';
import { SYSTEM_USER_ID } from '../system-user';
import { WorkflowExecutor } from '../workflow/workflow-executor';
import { RequestAssigneeService } from './request-assignee.service';
import { RequestTypeService } from './request-type.service';

export interface WorkflowRequestPageCursor {
  all?: QueryDocumentSnapshot<DocumentData>;
  branchFetched?: QueryDocumentSnapshot<DocumentData>;
  destinationFetched?: QueryDocumentSnapshot<DocumentData>;
  branchBuffer?: QueryDocumentSnapshot<DocumentData>[];
  destinationBuffer?: QueryDocumentSnapshot<DocumentData>[];
  consumedCount?: number;
  totalCount?: number;
}

export interface WorkflowRequestPage {
  requests: WorkflowRequest[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: WorkflowRequestPageCursor;
}

@Injectable({ providedIn: 'root' })
export class WorkflowService {
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
    const [assignedTo, autoApprove] = await Promise.all([
      this.resolveAssignedTo(draft),
      this.requestTypeService.isAutoApprove(partial.requestType),
    ]);
    const payload: WorkflowRequest = { ...draft, assignedTo };
    const ref = doc(collection(firestore, this.topicName));
    const year = new Date().getFullYear();
    const counterRef = doc(firestore, 'SystemCounters', `request-${year}`);
    await runTransaction(firestore, async (transaction) => {
      const counter = await transaction.get(counterRef);
      const nextNumber = Number(counter.data()?.['nextNumber'] || 0) + 1;
      const requestNumber = `REQ-${year}-${String(nextNumber).padStart(6, '0')}`;
      transaction.set(counterRef, { nextNumber }, { merge: true });
      transaction.set(ref, { ...payload, requestNumber });
      payload.requestNumber = requestNumber;
    });
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
    if (autoApprove) {
      await this.updateStatus(
        ref.id,
        RequestStatus.Approved,
        SYSTEM_USER_ID,
        partial.remarks || 'Auto approved',
      );
    }
    return ref.id;
  }

  async getForBranchPage(
    branchId: string,
    pageSize: number,
    cursor?: WorkflowRequestPageCursor,
    sortField: 'requestedOn' | 'requestType' = 'requestedOn',
    sortDirection: 'asc' | 'desc' = 'desc',
  ): Promise<WorkflowRequestPage> {
    if (!branchId) return { requests: [], totalCount: 0, hasMore: false };
    const requestsRef = collection(firestore, this.topicName);
    const pageLimit = Math.max(1, Math.min(pageSize, 100));
    const order = orderBy(sortField, sortDirection);

    if (branchId === '0') {
      const pageQuery = query(
        requestsRef,
        order,
        ...(cursor?.all ? [startAfter(cursor.all)] : []),
        limit(pageLimit + 1),
      );
      const [snapshot, count] = await Promise.all([
        getDocs(pageQuery),
        cursor?.totalCount !== undefined
          ? Promise.resolve(null)
          : getCountFromServer(query(requestsRef)),
      ]);
      const pageDocs = snapshot.docs.slice(0, pageLimit);
      const last = pageDocs[pageDocs.length - 1];
      const totalCount = cursor?.totalCount ?? count?.data().count ?? 0;
      const consumedCount = (cursor?.consumedCount || 0) + pageDocs.length;
      const hasMore = consumedCount < totalCount;
      return {
        requests: pageDocs.map((item) => this.mapDoc(item.data(), item.id)),
        totalCount,
        hasMore,
        ...(hasMore && last
          ? { nextCursor: { all: last, consumedCount, totalCount } }
          : {}),
      };
    }

    const branchQuery = query(requestsRef, where('branchId', '==', branchId));
    const destinationQuery = query(requestsRef, where('toBranchId', '==', branchId));
    const branchBuffer = [...(cursor?.branchBuffer || [])];
    const destinationBuffer = [...(cursor?.destinationBuffer || [])];
    const branchFetchLimit = Math.max(0, pageLimit - branchBuffer.length);
    const destinationFetchLimit = Math.max(0, pageLimit - destinationBuffer.length);
    const branchPageQuery = query(
      branchQuery,
      order,
      ...(cursor?.branchFetched ? [startAfter(cursor.branchFetched)] : []),
      ...(branchFetchLimit ? [limit(branchFetchLimit)] : []),
    );
    const destinationPageQuery = query(
      destinationQuery,
      order,
      ...(cursor?.destinationFetched ? [startAfter(cursor.destinationFetched)] : []),
      ...(destinationFetchLimit ? [limit(destinationFetchLimit)] : []),
    );
    const [branchSnapshot, destinationSnapshot, counts] = await Promise.all([
      branchFetchLimit ? getDocs(branchPageQuery) : Promise.resolve(null),
      destinationFetchLimit ? getDocs(destinationPageQuery) : Promise.resolve(null),
      cursor?.totalCount !== undefined
        ? Promise.resolve(null)
        : Promise.all([
            getCountFromServer(branchQuery),
            getCountFromServer(destinationQuery),
            getCountFromServer(
              query(
                requestsRef,
                where('branchId', '==', branchId),
                where('toBranchId', '==', branchId),
              ),
            ),
          ]),
    ]);

    const branchDocs = branchSnapshot?.docs || [];
    const destinationDocs = destinationSnapshot?.docs || [];
    branchBuffer.push(...branchDocs);
    destinationBuffer.push(...destinationDocs);
    const merged = new Map<string, QueryDocumentSnapshot<DocumentData>>();
    [...branchBuffer, ...destinationBuffer].forEach((item) =>
      merged.set(item.id, item),
    );
    const orderedDocs = [...merged.values()].sort((left, right) =>
      this.compareRequestDocs(left, right, sortField, sortDirection),
    );
    const pageDocs = orderedDocs.slice(0, pageLimit);
    const consumedIds = new Set(pageDocs.map((item) => item.id));
    const remainingBranch = branchBuffer.filter((item) => !consumedIds.has(item.id));
    const remainingDestination = destinationBuffer.filter((item) => !consumedIds.has(item.id));
    const totalCount = cursor?.totalCount ?? (counts
      ? counts[0].data().count + counts[1].data().count - counts[2].data().count
      : 0);
    const consumedCount = (cursor?.consumedCount || 0) + pageDocs.length;
    const hasMore = consumedCount < totalCount;
    const nextCursor: WorkflowRequestPageCursor = {
      branchFetched: branchDocs[branchDocs.length - 1] || cursor?.branchFetched,
      destinationFetched:
        destinationDocs[destinationDocs.length - 1] || cursor?.destinationFetched,
      branchBuffer: remainingBranch,
      destinationBuffer: remainingDestination,
      consumedCount,
      totalCount,
    };

    return {
      requests: pageDocs.map((item) => this.mapDoc(item.data(), item.id)),
      totalCount,
      hasMore,
      ...(hasMore ? { nextCursor } : {}),
    };
  }

  async getRecentForBranch(branchId: string, count: number): Promise<WorkflowRequest[]> {
    if (!branchId) return [];
    const ref = collection(firestore, this.topicName);
    const pageSize = Math.max(1, Math.min(count, 50));
    if (branchId === '0') {
      const snapshot = await getDocs(query(ref, orderBy('requestedOn', 'desc'), limit(pageSize)));
      return this.mapSnapshot(snapshot);
    }
    const [source, destination] = await Promise.all([
      getDocs(
        query(
          ref,
          where('branchId', '==', branchId),
          orderBy('requestedOn', 'desc'),
          limit(pageSize),
        ),
      ),
      getDocs(
        query(
          ref,
          where('toBranchId', '==', branchId),
          orderBy('requestedOn', 'desc'),
          limit(pageSize),
        ),
      ),
    ]);
    const unique = new Map<string, QueryDocumentSnapshot<DocumentData>>();
    [...source.docs, ...destination.docs].forEach((item) => unique.set(item.id, item));
    return [...unique.values()]
      .sort((left, right) => this.compareRequestDocs(left, right, 'requestedOn', 'desc'))
      .slice(0, pageSize)
      .map((item) => this.mapDoc(item.data(), item.id));
  }

  async getPendingTransferCount(branchId: string): Promise<number> {
    if (!branchId) return 0;
    const ref = collection(firestore, this.topicName);
    const base = [where('requestType', '==', RequestType.Transfer), where('status', '==', RequestStatus.Pending)];
    if (branchId === '0') {
      return (await getCountFromServer(query(ref, ...base))).data().count;
    }
    const [sourceCount, destinationCount, overlapCount] = await Promise.all([
      getCountFromServer(query(ref, where('branchId', '==', branchId), ...base)),
      getCountFromServer(query(ref, where('toBranchId', '==', branchId), ...base)),
      getCountFromServer(
        query(
          ref,
          where('branchId', '==', branchId),
          where('toBranchId', '==', branchId),
          ...base,
        ),
      ),
    ]);
    return sourceCount.data().count + destinationCount.data().count - overlapCount.data().count;
  }

  async getApprovedSalesSince(branchId: string, fromDate: Date): Promise<WorkflowRequest[]> {
    const ref = collection(firestore, this.topicName);
    const constraints = [
      where('requestType', '==', RequestType.Sales),
      where('status', '==', RequestStatus.Approved),
      where('requestedOn', '>=', Timestamp.fromDate(fromDate)),
      orderBy('requestedOn', 'desc'),
    ];
    const snapshot = await getDocs(
      query(ref, ...(branchId && branchId !== '0' ? [where('branchId', '==', branchId)] : []), ...constraints),
    );
    return this.mapSnapshot(snapshot);
  }

  private compareRequestDocs(
    left: QueryDocumentSnapshot<DocumentData>,
    right: QueryDocumentSnapshot<DocumentData>,
    sortField: 'requestedOn' | 'requestType',
    sortDirection: 'asc' | 'desc',
  ): number {
    const leftValue = left.data()[sortField];
    const rightValue = right.data()[sortField];
    const leftComparable =
      sortField === 'requestedOn'
        ? this.dateSortValue(leftValue)
        : String(leftValue || '');
    const rightComparable =
      sortField === 'requestedOn'
        ? this.dateSortValue(rightValue)
        : String(rightValue || '');
    if (leftComparable < rightComparable) return sortDirection === 'asc' ? -1 : 1;
    if (leftComparable > rightComparable) return sortDirection === 'asc' ? 1 : -1;
    return left.id.localeCompare(right.id);
  }

  private dateSortValue(value: unknown): number {
    if (value instanceof Timestamp) return value.toMillis();
    if (value instanceof Date) return value.getTime();
    return 0;
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
    const updatedRequest: WorkflowRequest = {
      ...current,
      status,
      approvedBy: approver,
      approvedOn: new Date(),
      remarks,
    };
    await this.executor.run(updatedRequest, status, remarks, approver);
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

}
