import { StockService } from '../core/services/stock.service';
import { WorkflowFunctionContext } from '../core/workflow/workflow-action';

async function stockLines(stockService: StockService, context: WorkflowFunctionContext) {
  const stock = await stockService.getStockById(context.request.moduleId);
  if (!stock?.stockid || !stock.branchid) {
    throw new Error('Stock was not found');
  }
  const details = await stockService.getStockDetails(stock.stockid);
  return {
    branchId: stock.branchid,
    items: details.map((detail) => ({
      productId: detail.productid,
      quantity: Number(detail.quantity) || 0,
    })),
  };
}

async function apply(
  stockService: StockService,
  context: WorkflowFunctionContext,
  action: (branchId: string, items: { productId: string; quantity: number }[]) => Promise<void>,
): Promise<void> {
  const stock = await stockLines(stockService, context);
  await action(stock.branchId, stock.items);
}

export function holdInbound(
  stockService: StockService,
  context: WorkflowFunctionContext,
): Promise<void> {
  return apply(stockService, context, (branchId, items) =>
    stockService.holdInbound(branchId, items),
  );
}

export function acceptInbound(
  stockService: StockService,
  context: WorkflowFunctionContext,
): Promise<void> {
  return apply(stockService, context, (branchId, items) =>
    stockService.acceptInbound(branchId, items),
  );
}

export function cancelInbound(
  stockService: StockService,
  context: WorkflowFunctionContext,
): Promise<void> {
  return apply(stockService, context, (branchId, items) =>
    stockService.cancelInbound(branchId, items),
  );
}

export function holdOutbound(
  stockService: StockService,
  context: WorkflowFunctionContext,
): Promise<void> {
  return apply(stockService, context, (branchId, items) =>
    stockService.holdOutbound(branchId, items),
  );
}

export function acceptOutbound(
  stockService: StockService,
  context: WorkflowFunctionContext,
): Promise<void> {
  return apply(stockService, context, (branchId, items) =>
    stockService.acceptOutbound(branchId, items),
  );
}

export function cancelOutbound(
  stockService: StockService,
  context: WorkflowFunctionContext,
): Promise<void> {
  return apply(stockService, context, (branchId, items) =>
    stockService.cancelOutbound(branchId, items),
  );
}
