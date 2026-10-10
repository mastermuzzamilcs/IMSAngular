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

export interface WorkflowRequest {
  requestId?: string;
  moduleId: string;
  requestType: RequestType;
  status: RequestStatus;
  requestedBy: string;
  requestedOn: Date;
  approvedBy?: string;
  approvedOn?: Date;
  remarks?: string;
}
