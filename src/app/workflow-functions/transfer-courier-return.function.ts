import { Injectable } from '@angular/core';
import { RequestStatus } from '../core/Models/WorkflowModel';
import { StockService } from '../core/services/stock.service';
import { TransferService } from '../core/services/transfer.service';
import { WorkflowService } from '../core/services/Workflow.service';
import { WorkflowActionRegistry } from '../core/workflow/workflow-action.registry';
import { WorkflowAction, WorkflowFunctionContext } from '../core/workflow/workflow-action';
import { loadTransfer } from './transfer-requests';

@Injectable({ providedIn: 'root' })
export class TransferCourierReturnFunction implements WorkflowAction {
  readonly className = 'TransferCourierReturnFunction';

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
    if (!transfer.stockOutId || !transfer.stockOutRequestId) {
      throw new Error('Stock out request was not found for this transfer');
    }

    const stock = await this.stockService.getStockById(transfer.stockOutId);
    if (stock?.stockid && stock.status === RequestStatus.Approved) {
      const details = await this.stockService.getStockDetails(stock.stockid);
      await this.stockService.restoreApprovedOutbound(
        stock.branchid,
        details.map((detail) => ({
          productId: detail.productid,
          quantity: Number(detail.quantity) || 0,
        })),
      );
      await this.stockService.MarkRequestDetails(
        stock.stockid,
        stock.branchid,
        RequestStatus.Rejected,
      );
    }

    const child = await this.workflowService.getById(transfer.stockOutRequestId);
    if (child?.requestId && child.status !== RequestStatus.Rejected) {
      await this.workflowService.recordStatus(
        child.requestId,
        RequestStatus.Rejected,
        context.approver,
        'Courier returned the transfer to the source branch',
      );
    }
  }
}
