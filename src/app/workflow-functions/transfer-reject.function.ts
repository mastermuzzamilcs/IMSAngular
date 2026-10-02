import { Injectable } from '@angular/core';
import { RequestStatus } from '../core/Models/WorkflowModel';
import { TransferService } from '../core/services/transfer.service';
import { WorkflowService } from '../core/services/Workflow.service';
import { WorkflowActionRegistry } from '../core/workflow/workflow-action.registry';
import { WorkflowAction, WorkflowFunctionContext } from '../core/workflow/workflow-action';
import { loadTransfer, moveChildRequest } from './transfer-requests';

@Injectable({ providedIn: 'root' })
export class TransferRejectFunction implements WorkflowAction {
  readonly className = 'TransferRejectFunction';

  constructor(
    registry: WorkflowActionRegistry,
    private transferService: TransferService,
    private workflowService: WorkflowService,
  ) {
    registry.register(this);
  }

  async Execute(context: WorkflowFunctionContext): Promise<void> {
    const transfer = await loadTransfer(this.transferService, context);
    if (!transfer.stockOutRequestId) {
      return;
    }
    const child = await this.workflowService.getById(transfer.stockOutRequestId);
    if (!child?.requestId || child.status === RequestStatus.Rejected) {
      return;
    }
    if (child.status !== RequestStatus.Pending) {
      throw new Error(
        'This transfer was already dispatched. Use courier returned to send the stock back.',
      );
    }
    await moveChildRequest(
      this.workflowService,
      child.requestId,
      RequestStatus.Rejected,
      context.approver,
      context.remarks,
      'Stock out request was not found for this transfer',
    );
  }
}
