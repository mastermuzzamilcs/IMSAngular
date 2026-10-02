import { Injectable } from '@angular/core';
import { WorkflowAction } from './workflow-action';

@Injectable({ providedIn: 'root' })
export class WorkflowActionRegistry {
  private readonly actions = new Map<string, WorkflowAction>();

  register(action: WorkflowAction): void {
    if (action?.className && typeof action.Execute === 'function') {
      this.actions.set(action.className, action);
    }
  }

  resolve(className: string): WorkflowAction | undefined {
    const action = this.actions.get(className);
    if (!action || typeof action.Execute !== 'function') {
      return undefined;
    }
    return action;
  }
}
