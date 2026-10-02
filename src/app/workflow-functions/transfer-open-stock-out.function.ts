import { Injectable } from '@angular/core';
import { RequestType } from '../core/Models/WorkflowModel';
import { StockService } from '../core/services/stock.service';
import { TransferService } from '../core/services/transfer.service';
import { WorkflowService } from '../core/services/Workflow.service';
import { WorkflowActionRegistry } from '../core/workflow/workflow-action.registry';
import { WorkflowAction, WorkflowFunctionContext } from '../core/workflow/workflow-action';
import { ensureBranchStockRequest, loadTransfer } from './transfer-requests';

@Injectable({ providedIn: 'root' })
export class TransferOpenStockOutFunction implements WorkflowAction {
  readonly className = 'TransferOpenStockOutFunction';

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
}
