import { RequestStatus, RequestType } from '../Models/WorkflowModel';

export enum NotificationChannel {
  InApp = 'InApp',
}

export enum NotificationAudience {
  Public = 'Public',
  Group = 'Group',
  CustomUsers = 'CustomUsers',
}

export const NOTIFY_FUNCTION_CODE = 'Notify';
export const NOTIFY_FUNCTION_PRIORITY = 50;

export const notificationChannelLabel: Record<NotificationChannel, string> = {
  [NotificationChannel.InApp]: 'In-app',
};

export const notificationAudienceLabel: Record<NotificationAudience, string> = {
  [NotificationAudience.Public]: 'Public',
  [NotificationAudience.Group]: 'Group',
  [NotificationAudience.CustomUsers]: 'Custom users',
};

export interface NotificationEventBinding {
  requestType: RequestType;
  status: RequestStatus;
}

export interface NotificationTemplate {
  id?: string;
  code: string;
  name: string;
  branchid: string;
  channel: NotificationChannel;
  audience: NotificationAudience;
  includePublic: boolean;
  groupIds: string[];
  userIds: string[];
  audienceSources: string[];
  subject: string;
  body: string;
  summary: string;
  enabled: boolean;
  events: NotificationEventBinding[];
}

export function legacyNotificationAudience(template: {
  includePublic: boolean;
  groupIds: string[];
}): NotificationAudience {
  if (template.includePublic) {
    return NotificationAudience.Public;
  }
  if (template.groupIds.length) {
    return NotificationAudience.Group;
  }
  return NotificationAudience.CustomUsers;
}

export function notificationAudienceSummary(template: {
  includePublic: boolean;
  groupIds: string[];
  userIds: string[];
  audienceSources: string[];
}): string {
  const parts: string[] = [];
  if (template.includePublic) {
    parts.push('Public');
  }
  if (template.groupIds.length) {
    parts.push('Groups');
  }
  if (template.userIds.length) {
    parts.push('Custom users');
  }
  parts.push(...template.audienceSources);
  return parts.join(', ') || 'None';
}

export interface NotificationDispatch {
  channel: NotificationChannel;
  audience: NotificationAudience;
  templateCode: string;
  subject: string;
  body: string;
  summary: string;
  recipientIds: string[];
  requestId: string;
  requestType: string;
  status: string;
  moduleId: string;
}

export interface InboxNotification {
  id: string;
  userid: string;
  channel: NotificationChannel;
  audience: NotificationAudience;
  templateCode: string;
  subject: string;
  body: string;
  summary: string;
  requestId: string;
  requestType: string;
  status: string;
  moduleId: string;
  read: boolean;
  createdAtMs: number;
}

export interface NotificationTokens {
  requestId: string;
  requestType: string;
  status: string;
  remarks: string;
  approver: string;
  moduleId: string;
}
