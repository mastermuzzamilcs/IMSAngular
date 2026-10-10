import { Injectable } from '@angular/core';
import { NotificationEngine } from '../core/notifications/notification-engine';
import { WorkflowAction, WorkflowFunctionContext } from '../core/workflow/workflow-action';
import { WorkflowActionRegistry } from '../core/workflow/workflow-action.registry';

@Injectable({ providedIn: 'root' })
export class NotifyFunction implements WorkflowAction {
  readonly className = 'NotifyFunction';

  constructor(
    registry: WorkflowActionRegistry,
    private engine: NotificationEngine,
  ) {
    registry.register(this);
  }

  Execute(context: WorkflowFunctionContext): Promise<void> {
    return this.engine.publish(context);
  }
}
