import { RequestStatus, RequestType } from './WorkflowModel';

export interface WorkflowFunctionLink {
  id?: string;
  requestType: RequestType;
  status: RequestStatus;
  functionKey: string;
  priority: number;
}
