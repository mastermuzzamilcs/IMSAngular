import { Injectable } from '@angular/core';
import { ItemSourceEvaluator } from '../item-sources/item-source-evaluator';
import { WorkflowFunctionContext } from '../workflow/workflow-action';
import { NotificationAudienceResolver } from './audience-resolver';
import { NotificationDispatcherRegistry } from './notification-dispatcher.registry';
import { legacyNotificationAudience, NotificationTemplate } from './notification.model';
import { renderNotificationText } from './notification-renderer';
import { NotificationTemplateService } from '../services/notification-template.service';
import { ALL_BRANCHES_ID } from '../services/user-branch-association.service';

@Injectable({ providedIn: 'root' })
export class NotificationEngine {
  constructor(
    private templateService: NotificationTemplateService,
    private audienceResolver: NotificationAudienceResolver,
    private registry: NotificationDispatcherRegistry,
    private itemSourceEvaluator: ItemSourceEvaluator,
  ) {}

  async publish(context: WorkflowFunctionContext): Promise<void> {
    const templates = await this.templateService.getTemplates();
    const matches = templates.filter(
      (template) => template.enabled && this.matches(template, context),
    );
    if (!matches.length) {
      return;
    }
    const itemValues = await this.itemValues(matches, context);
    const tokens = {
      requestId: context.request.requestId || '',
      requestType: String(context.request.requestType || ''),
      status: String(context.status || ''),
      remarks: context.remarks || '',
      approver: context.approver || '',
      moduleId: context.request.moduleId || '',
    };
    const textTokens = { ...tokens, ...itemValues };
    for (const template of matches) {
      const dispatcher = this.registry.resolve(template.channel);
      if (!dispatcher) {
        continue;
      }
      const recipientIds = await this.audienceResolver.resolve(template, context);
      if (!recipientIds.length) {
        continue;
      }
      await dispatcher.dispatch({
        channel: template.channel,
        audience: legacyNotificationAudience(template),
        templateCode: template.code,
        subject: renderNotificationText(template.subject, textTokens),
        body: renderNotificationText(template.body, textTokens),
        summary: renderNotificationText(template.summary, textTokens),
        recipientIds,
        requestId: tokens.requestId,
        requestType: tokens.requestType,
        status: tokens.status,
        moduleId: tokens.moduleId,
      });
    }
  }

  private async itemValues(
    templates: NotificationTemplate[],
    context: WorkflowFunctionContext,
  ): Promise<Record<string, string>> {
    try {
      return await this.itemSourceEvaluator.valuesFor(
        templates.flatMap((template) => [
          template.subject,
          template.summary || '',
          template.body || '',
        ]),
        context,
      );
    } catch (error) {
      console.error('Item source evaluation failed', error);
      return {};
    }
  }

  private matches(template: NotificationTemplate, context: WorkflowFunctionContext): boolean {
    const eventMatch = template.events.some(
      (event) =>
        event.requestType === context.request.requestType && event.status === context.status,
    );
    if (!eventMatch) {
      return false;
    }
    const templateBranch = template.branchid || ALL_BRANCHES_ID;
    if (templateBranch === ALL_BRANCHES_ID) {
      return true;
    }
    return [context.request.branchId, context.request.toBranchId]
      .filter((value): value is string => !!value)
      .includes(templateBranch);
  }
}
