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
    const definitions = await this.definitionService.getFunctions();
    const definitionsByCode = new Map(
      definitions.map((definition) => [definition.code, definition]),
    );
    for (const link of links) {
      const definition = definitionsByCode.get(link.functionKey);
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
