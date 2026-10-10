import { Injectable } from '@angular/core';
import { InAppNotificationDispatcher } from './channels/in-app.dispatcher';

/**
 * Constructs each channel so its dispatcher registers itself.
 * A new type, such as email, is added by creating its dispatcher class and listing it here.
 */
@Injectable({ providedIn: 'root' })
export class NotificationChannelBootstrap {
  constructor(_inApp: InAppNotificationDispatcher) {}
}
