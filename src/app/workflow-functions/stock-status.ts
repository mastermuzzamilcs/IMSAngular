import { RequestStatus } from '../core/Models/WorkflowModel';
import { StockService } from '../core/services/stock.service';
import { WorkflowFunctionContext } from '../core/workflow/workflow-action';

export async function executeStockStatus(
  stockService: StockService,
  context: WorkflowFunctionContext,
  status: RequestStatus,
): Promise<void> {
  const stock = await stockService.getStockById(context.request.moduleId);
  if (!stock?.stockid) {
    throw new Error('Stock was not found');
  }
  await stockService.MarkRequestDetails(stock.stockid, stock.branchid, status);
}
