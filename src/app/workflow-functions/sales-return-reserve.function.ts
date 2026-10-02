import { Injectable } from '@angular/core';
import { StockService } from '../core/services/stock.service';
import { WorkflowActionRegistry } from '../core/workflow/workflow-action.registry';
import { holdInbound } from './stock-hold';
import { WorkflowAction, WorkflowFunctionContext } from '../core/workflow/workflow-action';

@Injectable({ providedIn: 'root' })
export class SalesReturnReserveFunction implements WorkflowAction {
  readonly className = 'SalesReturnReserveFunction';

  constructor(
    registry: WorkflowActionRegistry,
    private stockService: StockService,
  ) {
    registry.register(this);
  }

  Execute(context: WorkflowFunctionContext): Promise<void> {
    return holdInbound(this.stockService, context);
  }
}
