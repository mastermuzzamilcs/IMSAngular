import { Injectable } from '@angular/core';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { firestore } from '../../../firebase-config';
import { NotificationDispatcher } from '../notification-dispatcher';
import { NotificationDispatcherRegistry } from '../notification-dispatcher.registry';
import { NotificationChannel, NotificationDispatch } from '../notification.model';

const chunkSize = 80;
const maxText = 8_000;

@Injectable({ providedIn: 'root' })
export class InAppNotificationDispatcher implements NotificationDispatcher {
  readonly channel = NotificationChannel.InApp;
  private readonly topicName = 'Notifications';

  constructor(registry: NotificationDispatcherRegistry) {
    registry.register(this);
  }

  async dispatch(message: NotificationDispatch): Promise<void> {
    const recipients = [...new Set(message.recipientIds.filter((id) => id.trim().length > 0))];
    for (let index = 0; index < recipients.length; index += chunkSize) {
      const batch = writeBatch(firestore);
      const createdAtMs = Date.now();
      recipients.slice(index, index + chunkSize).forEach((userid) => {
        const ref = doc(collection(firestore, this.topicName));
        batch.set(ref, {
          userid,
          channel: message.channel,
          audience: message.audience,
          templateCode: message.templateCode,
          subject: clip(message.subject, 500),
          body: clip(message.body, maxText),
          summary: clip(message.summary, 1_000),
          requestId: message.requestId,
          requestType: message.requestType,
          status: message.status,
          moduleId: message.moduleId,
          read: false,
          createdAtMs,
        });
      });
      await batch.commit();
    }
  }
}

function clip(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}
