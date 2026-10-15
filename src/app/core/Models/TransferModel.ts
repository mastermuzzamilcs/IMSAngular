import { RequestStatus } from './WorkflowModel';

export type TransferDate = Date | string | number | { toDate: () => Date };

export interface TransferItem {
  productId: string;
  productName?: string;
  brand?: string;
  description?: string;
  quantity: number;
}

export interface Transfer {
  id?: string; // Firestore document ID
  transferId?: string;

  fromBranch?: string;
  fromBranchName?: string; // Added for display

  toBranch?: string;
  toBranchName?: string; // Added for display

  reason?: string;

  userId?: string;
  userName?: string;
  branchId?: string;
  branchName?: string;

  expectedDate: TransferDate;

  requestDate: TransferDate;

  status: RequestStatus;

  items: TransferItem[];

  stockOutId?: string;
  stockOutRequestId?: string;
  stockInId?: string;
  stockInRequestId?: string;
}
