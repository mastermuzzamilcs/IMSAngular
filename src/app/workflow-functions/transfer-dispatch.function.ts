import { Injectable } from '@angular/core';
import { RequestStatus, RequestType } from '../core/Models/WorkflowModel';
import { StockService } from '../core/services/stock.service';
import { TransferService } from '../core/services/transfer.service';
import { WorkflowService } from '../core/services/Workflow.service';
import { WorkflowActionRegistry } from '../core/workflow/workflow-action.registry';
import { WorkflowAction, WorkflowFunctionContext } from '../core/workflow/workflow-action';
import { ensureBranchStockRequest, loadTransfer, moveChildRequest } from './transfer-requests';

@Injectable({ providedIn: 'root' })
export class TransferDispatchFunction implements WorkflowAction {
  readonly className = 'TransferDispatchFunction';

  constructor(
    registry: WorkflowActionRegistry,
    private transferService: TransferService,
    private stockService: StockService,
    private workflowService: WorkflowService,
  ) {
    registry.register(this);
  }

  async Execute(context: WorkflowFunctionContext): Promise<void> {
    const transfer = await loadTransfer(this.transferService, context);
    if (!transfer.stockOutRequestId) {
      await ensureBranchStockRequest(
        this.stockService,
        this.workflowService,
        this.transferService,
        transfer,
        transfer.fromBranch || transfer.branchId || '',
        'out',
        RequestType.StockOut,
        context.approver,
      );
    }
    await moveChildRequest(
      this.workflowService,
      transfer.stockOutRequestId,
      RequestStatus.Approved,
      context.approver,
      context.remarks,
      'Stock out request was not found for this transfer',
    );
  }
}
