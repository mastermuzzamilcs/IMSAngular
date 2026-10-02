import { Injectable } from '@angular/core';
import { StockService } from '../core/services/stock.service';
import { WorkflowActionRegistry } from '../core/workflow/workflow-action.registry';
import { acceptOutbound } from './stock-hold';
import { WorkflowAction, WorkflowFunctionContext } from '../core/workflow/workflow-action';

@Injectable({ providedIn: 'root' })
export class SalesAcceptFunction implements WorkflowAction {
  readonly className = 'SalesAcceptFunction';

  constructor(
    registry: WorkflowActionRegistry,
    private stockService: StockService,
  ) {
    registry.register(this);
  }

  Execute(context: WorkflowFunctionContext): Promise<void> {
    return acceptOutbound(this.stockService, context);
  }
}
