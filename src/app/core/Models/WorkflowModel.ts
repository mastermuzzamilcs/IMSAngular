export enum RequestType {
  StockIn = 'StockIn',
  StockOut = 'StockOut',
  Sales = 'Sales',
  SalesReturn = 'SalesReturn',
  Transfer = 'Transfer',
}

export enum RequestStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  InProcess = 'In Process',
  Dispatched = 'Dispatched',
  InTransit = 'In Transit',
  ArrivedAtStation = 'Arrived at Station',
  Received = 'Received',
  CourierReturned = 'Courier Returned',
  Completed = 'Completed',
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
