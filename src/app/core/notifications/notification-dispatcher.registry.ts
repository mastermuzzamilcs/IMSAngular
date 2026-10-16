import { Injectable } from '@angular/core';
import { NotificationDispatcher } from './notification-dispatcher';
import { NotificationChannel } from './notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationDispatcherRegistry {
  private readonly dispatchers = new Map<NotificationChannel, NotificationDispatcher>();

  register(dispatcher: NotificationDispatcher): void {
    if (dispatcher?.channel && typeof dispatcher.dispatch === 'function') {
      this.dispatchers.set(dispatcher.channel, dispatcher);
    }
  }

  resolve(channel: NotificationChannel): NotificationDispatcher | undefined {
    return this.dispatchers.get(channel);
  }

  channels(): NotificationChannel[] {
    return [...this.dispatchers.keys()];
  }
}
