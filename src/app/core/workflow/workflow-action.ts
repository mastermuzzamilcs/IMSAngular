import { RequestStatus, WorkflowRequest } from '../Models/WorkflowModel';

export interface WorkflowFunctionContext {
  request: WorkflowRequest;
  status: RequestStatus;
  remarks: string;
  approver: string;
}

export interface WorkflowAction {
  readonly className: string;
  Execute(context: WorkflowFunctionContext): Promise<void>;
}
