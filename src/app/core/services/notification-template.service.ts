import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import {
  NOTIFY_FUNCTION_CODE,
  NOTIFY_FUNCTION_PRIORITY,
  NotificationAudience,
  NotificationChannel,
  NotificationEventBinding,
  NotificationTemplate,
} from '../notifications/notification.model';
import { RequestStatus, RequestType } from '../Models/WorkflowModel';
import { WorkflowFunctionDefinitionService } from './workflow-function-definition.service';
import { WorkflowFunctionLinkService } from './workflow-function-link.service';

@Injectable({ providedIn: 'root' })
export class NotificationTemplateService {
  private readonly topicName = 'NotificationTemplates';

  constructor(
    private linkService: WorkflowFunctionLinkService,
    private definitionService: WorkflowFunctionDefinitionService,
  ) {}

  async getTemplates(): Promise<NotificationTemplate[]> {
    const snapshot = await getDocs(collection(firestore, this.topicName));
    return snapshot.docs
      .map((item) => this.mapTemplate(item.id, item.data()))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async addTemplate(template: NotificationTemplate): Promise<void> {
    await this.assertCode(template);
    await addDoc(collection(firestore, this.topicName), this.payload(template));
    await this.syncNotifyLinks();
  }

  async updateTemplate(template: NotificationTemplate): Promise<void> {
    if (!template.id) {
      return;
    }
    await this.assertCode(template);
    await setDoc(doc(firestore, this.topicName, template.id), this.payload(template));
    await this.syncNotifyLinks();
  }

  async deleteTemplate(id: string): Promise<void> {
    await deleteDoc(doc(firestore, this.topicName, id));
    await this.syncNotifyLinks();
  }

  private async syncNotifyLinks(): Promise<void> {
    await this.definitionService.getFunctions();
    const templates = await this.getTemplates();
    const desired = new Map<string, NotificationEventBinding>();
    templates
      .filter((template) => template.enabled)
      .forEach((template) => {
        template.events.forEach((event) => {
          desired.set(`${event.requestType}|${event.status}`, event);
        });
      });
    const links = await this.linkService.getLinks();
    const notifyLinks = links.filter((link) => link.functionKey === NOTIFY_FUNCTION_CODE);
    for (const event of desired.values()) {
      const existing = notifyLinks.find(
        (link) => link.requestType === event.requestType && link.status === event.status,
      );
      if (!existing) {
        await this.linkService.addLink({
          requestType: event.requestType,
          status: event.status,
          functionKey: NOTIFY_FUNCTION_CODE,
          priority: NOTIFY_FUNCTION_PRIORITY,
        });
      }
    }
    for (const link of notifyLinks) {
      if (!link.id || desired.has(`${link.requestType}|${link.status}`)) {
        continue;
      }
      await this.linkService.deleteLink(link.id);
    }
  }

  private async assertCode(template: NotificationTemplate): Promise<void> {
    const snapshot = await getDocs(collection(firestore, this.topicName));
    const duplicate = snapshot.docs.find(
      (item) => item.id !== template.id && item.data()['code'] === template.code,
    );
    if (duplicate) {
      throw new Error('A notification template with this code already exists');
    }
  }

  private payload(template: NotificationTemplate) {
    return {
      code: template.code.trim(),
      name: template.name.trim(),
      channel: template.channel,
      audience: template.audience,
      groupIds: template.groupIds,
      userIds: template.userIds,
      subject: template.subject,
      body: template.body,
      summary: template.summary,
      enabled: template.enabled,
      events: template.events.map((event) => ({
        requestType: event.requestType,
        status: event.status,
      })),
    };
  }

  private mapTemplate(id: string, data: Record<string, unknown>): NotificationTemplate {
    const events = Array.isArray(data['events']) ? data['events'] : [];
    return {
      id,
      code: String(data['code'] || ''),
      name: String(data['name'] || ''),
      channel: (data['channel'] as NotificationChannel) || NotificationChannel.InApp,
      audience: (data['audience'] as NotificationAudience) || NotificationAudience.Public,
      groupIds: this.stringList(data['groupIds']),
      userIds: this.stringList(data['userIds']),
      subject: String(data['subject'] || ''),
      body: String(data['body'] || ''),
      summary: String(data['summary'] || ''),
      enabled: data['enabled'] !== false,
      events: events
        .map((event) => this.mapEvent(event))
        .filter((event): event is NotificationEventBinding => event !== null),
    };
  }

  private mapEvent(value: unknown): NotificationEventBinding | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const event = value as Record<string, unknown>;
    const requestType = String(event['requestType'] || '') as RequestType;
    const status = String(event['status'] || '') as RequestStatus;
    if (!requestType || !status) {
      return null;
    }
    return { requestType, status };
  }

  private stringList(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map((item) => String(item || '')).filter((item) => item.length > 0);
  }
}
