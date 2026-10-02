import { RequestStatus, RequestType } from './WorkflowModel';

export interface WorkflowStatusTransition {
  id?: string;
  requestType: RequestType | '';
  fromStatus: RequestStatus;
  toStatus: RequestStatus;
  label: string;
}

export interface WorkflowTransitionOption {
  status: RequestStatus;
  label: string;
}
