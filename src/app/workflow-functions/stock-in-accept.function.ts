import { Injectable } from '@angular/core';
import { StockService } from '../core/services/stock.service';
import { WorkflowActionRegistry } from '../core/workflow/workflow-action.registry';
import { acceptInbound } from './stock-hold';
import { WorkflowAction, WorkflowFunctionContext } from '../core/workflow/workflow-action';

@Injectable({ providedIn: 'root' })
export class StockInAcceptFunction implements WorkflowAction {
  readonly className = 'StockInAcceptFunction';

  constructor(
    registry: WorkflowActionRegistry,
    private stockService: StockService,
  ) {
    registry.register(this);
  }

  Execute(context: WorkflowFunctionContext): Promise<void> {
    return acceptInbound(this.stockService, context);
  }
}
