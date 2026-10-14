import { Status } from '../enums/status.enum';

export const RequestStatus = {
  Pending: Status.Pending,
  Approved: Status.Approved,
  Rejected: Status.Rejected,
  InProcess: Status.InProcess,
  Dispatched: Status.Dispatched,
  InTransit: Status.InTransit,
  ArrivedAtStation: Status.ArrivedAtStation,
  Received: Status.Received,
  CourierReturned: Status.CourierReturned,
  Completed: Status.Completed,
} as const;

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export enum RequestType {
  StockIn = 'StockIn',
  StockOut = 'StockOut',
  Sales = 'Sales',
  SalesReturn = 'SalesReturn',
  Transfer = 'Transfer',
}

export interface RequestTypeSetting {
  requestType: RequestType;
  IS_Auto_Approve: boolean;
  /** Item source code resolved to the user who must act on new requests of this type. */
  assignedToSource: string;
}

export interface WorkflowRequest {
  requestId?: string;
  moduleId: string;
  requestType: RequestType;
  status: RequestStatus;
  requestedBy: string;
  requestedOn: Date;
  /** User who must perform every workflow action on this request. */
  assignedTo: string;
  approvedBy?: string;
  approvedOn?: Date;
  remarks?: string;
  /** Home / from branch. Internal request types are visible only here. */
  branchId?: string;
  /** Transfer destination. Transfer requests are visible on branchId and toBranchId. */
  toBranchId?: string;
}
