import { Injectable } from '@angular/core';
import { TransferService } from '../core/services/transfer.service';
import { WorkflowActionRegistry } from '../core/workflow/workflow-action.registry';
import { saveTransferStatus } from './transfer-status';
import { WorkflowAction, WorkflowFunctionContext } from '../core/workflow/workflow-action';

@Injectable({ providedIn: 'root' })
export class TransferUpdateStatusFunction implements WorkflowAction {
  readonly className = 'TransferUpdateStatusFunction';

  constructor(
    registry: WorkflowActionRegistry,
    private transferService: TransferService,
  ) {
    registry.register(this);
  }

  Execute(context: WorkflowFunctionContext): Promise<void> {
    return saveTransferStatus(this.transferService, context).then(() => undefined);
  }
}
