import { RequestStatus } from './WorkflowModel';

export interface TransferItem {
  productId: string;
  productName?: string;
  description?: string;
  quantity: number;
}

export interface Transfer {
  id?: string; // Firestore document ID

  fromBranch?: string;
  fromBranchName?: string; // Added for display

  toBranch?: string;
  toBranchName?: string; // Added for display

  reason?: string;

  userId?: string;
  userName?: string;
  branchId?: string;
  branchName?: string;

  expectedDate: any;

  requestDate: any;

  status: RequestStatus;

  items: TransferItem[];

  stockOutId?: string;
  stockOutRequestId?: string;
  stockInId?: string;
  stockInRequestId?: string;
}
