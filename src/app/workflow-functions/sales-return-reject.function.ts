import { Injectable } from '@angular/core';
import { RequestStatus } from '../core/Models/WorkflowModel';
import { StockService } from '../core/services/stock.service';
import { WorkflowActionRegistry } from '../core/workflow/workflow-action.registry';
import { executeStockStatus } from './stock-status';
import { WorkflowAction, WorkflowFunctionContext } from '../core/workflow/workflow-action';

@Injectable({ providedIn: 'root' })
export class SalesReturnRejectFunction implements WorkflowAction {
  readonly className = 'SalesReturnRejectFunction';

  constructor(
    registry: WorkflowActionRegistry,
    private stockService: StockService,
  ) {
    registry.register(this);
  }

  Execute(context: WorkflowFunctionContext): Promise<void> {
    return executeStockStatus(this.stockService, context, RequestStatus.Rejected);
  }
}
