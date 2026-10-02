import { Transfer } from '../core/Models/TransferModel';
import { TransferService } from '../core/services/transfer.service';
import { WorkflowFunctionContext } from '../core/workflow/workflow-action';

export async function saveTransferStatus(
  transferService: TransferService,
  context: WorkflowFunctionContext,
): Promise<Transfer> {
  const transfer = await transferService.getTransferById(context.request.moduleId);
  if (!transfer) {
    throw new Error('Transfer was not found');
  }
  const updated = {
    ...transfer,
    id: transfer.id || context.request.moduleId,
    status: context.status,
  };
  await transferService.updateTransfer(updated);
  return updated;
}
