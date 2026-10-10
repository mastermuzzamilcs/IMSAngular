import { Injectable } from '@angular/core';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { firestore } from '../../../firebase-config';
import { NotificationDispatcher } from '../notification-dispatcher';
import { NotificationDispatcherRegistry } from '../notification-dispatcher.registry';
import { NotificationChannel, NotificationDispatch } from '../notification.model';

const chunkSize = 400;

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
          subject: message.subject,
          body: message.body,
          summary: message.summary,
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
