import { Injectable } from '@angular/core';
import { RequestStatus } from '../core/Models/WorkflowModel';
import { CustomerService } from '../core/services/customer.service';
import { StockService } from '../core/services/stock.service';
import { WorkflowActionRegistry } from '../core/workflow/workflow-action.registry';
import { executeStockStatus } from './stock-status';
import { WorkflowAction, WorkflowFunctionContext } from '../core/workflow/workflow-action';

@Injectable({ providedIn: 'root' })
export class SalesApproveFunction implements WorkflowAction {
  readonly className = 'SalesApproveFunction';

  constructor(
    registry: WorkflowActionRegistry,
    private stockService: StockService,
    private customerService: CustomerService,
  ) {
    registry.register(this);
  }

  async Execute(context: WorkflowFunctionContext): Promise<void> {
    const stock = await this.stockService.getStockById(context.request.moduleId);
    if (stock?.customerName || stock?.customerid) {
      await this.customerService.ensureCustomer({
        id: stock.customerid,
        name: stock.customerName,
        phone: stock.customerPhone,
        email: stock.customerEmail,
        address: stock.customerAddress,
      });
    }
    await executeStockStatus(this.stockService, context, RequestStatus.Approved);
  }
}
