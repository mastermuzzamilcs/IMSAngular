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
  channel: NotificationChannel;
  audience: NotificationAudience;
  groupIds: string[];
  userIds: string[];
  subject: string;
  body: string;
  summary: string;
  enabled: boolean;
  events: NotificationEventBinding[];
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
