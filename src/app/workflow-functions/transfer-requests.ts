import { Transfer } from '../core/Models/TransferModel';
import { RequestStatus, RequestType } from '../core/Models/WorkflowModel';
import { StockService } from '../core/services/stock.service';
import { TransferService } from '../core/services/transfer.service';
import { WorkflowService } from '../core/services/Workflow.service';
import { WorkflowFunctionContext } from '../core/workflow/workflow-action';

export async function loadTransfer(
  transferService: TransferService,
  context: WorkflowFunctionContext,
): Promise<Transfer> {
  const transfer = await transferService.getTransferById(context.request.moduleId);
  if (!transfer) {
    throw new Error('Transfer was not found');
  }
  return {
    ...transfer,
    id: transfer.id || context.request.moduleId,
  };
}

export async function ensureBranchStockRequest(
  stockService: StockService,
  workflowService: WorkflowService,
  transferService: TransferService,
  transfer: Transfer,
  branchId: string,
  stocktype: 'in' | 'out',
  requestType: RequestType,
  approver: string,
): Promise<void> {
  if (!branchId) {
    throw new Error('Branch was not found for the transfer');
  }
  const stockKey = stocktype === 'out' ? 'stockOutId' : 'stockInId';
  const requestKey = stocktype === 'out' ? 'stockOutRequestId' : 'stockInRequestId';
  if (transfer[requestKey]) {
    return;
  }

  const remark =
    stocktype === 'out'
      ? `Stock out against transfer request ${transfer.id}`
      : `Stock in against transfer request ${transfer.id}`;
  let stockId = transfer[stockKey];
  if (!stockId) {
    const items = (transfer.items || []).map((item) => ({
      id: item.productId,
      quantity: Number(item.quantity) || 0,
      unitPrice: 0,
      discount: 0,
      total: 0,
      comments: remark,
    }));
    stockId = await stockService.addStockEntity({
      branch: branchId,
      vendor: '',
      date: new Date(),
      stockItems: items,
      TotalItems: items.length,
      SubTotal: 0,
      DiscountType: '',
      DiscountValue: 0,
      NetTotal: 0,
      status: RequestStatus.Pending,
      stocktype,
      remarks: remark,
    });
    transfer[stockKey] = stockId;
    await transferService.updateTransfer(transfer);
  }

  const existing = await workflowService.findByModule(stockId, requestType);
  const requestId =
    existing?.requestId ||
    (await workflowService.createRequest({
      moduleId: stockId,
      requestType,
      requestedBy: approver,
      remarks: remark,
    }));
  transfer[requestKey] = requestId;
  await transferService.updateTransfer(transfer);
}

export async function moveChildRequest(
  workflowService: WorkflowService,
  requestId: string | undefined,
  status: RequestStatus,
  approver: string,
  remarks: string,
  missingMessage: string,
): Promise<void> {
  if (!requestId) {
    throw new Error(missingMessage);
  }
  const child = await workflowService.getById(requestId);
  if (!child?.requestId || child.status === status) {
    return;
  }
  await workflowService.updateStatus(child.requestId, status, approver, remarks);
}
