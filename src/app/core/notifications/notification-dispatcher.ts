import { NotificationChannel, NotificationDispatch } from './notification.model';

export interface NotificationDispatcher {
  readonly channel: NotificationChannel;
  dispatch(message: NotificationDispatch): Promise<void>;
}
