import { Injectable } from '@angular/core';
import { RequestStatus, WorkflowRequest } from '../Models/WorkflowModel';
import { WorkflowFunctionDefinitionService } from '../services/workflow-function-definition.service';
import { WorkflowFunctionLinkService } from '../services/workflow-function-link.service';
import { WorkflowActionRegistry } from './workflow-action.registry';

@Injectable({ providedIn: 'root' })
export class WorkflowExecutor {
  constructor(
    private linkService: WorkflowFunctionLinkService,
    private definitionService: WorkflowFunctionDefinitionService,
    private registry: WorkflowActionRegistry,
  ) {}

  async run(
    request: WorkflowRequest,
    status: RequestStatus,
    remarks: string,
    approver: string,
  ): Promise<void> {
    const links = await this.linkService.getForEvent(request.requestType, status);
    for (const link of links) {
      const definition = link.functionKey
        ? await this.definitionService.getByCode(link.functionKey)
        : null;
      const action = definition?.className
        ? this.registry.resolve(definition.className)
        : undefined;
      if (!action) {
        continue;
      }
      await action.Execute({ request, status, remarks, approver });
    }
  }
}
