import { Injectable, NgZone } from '@angular/core';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { firestore } from '../../firebase-config';
import { NotificationSoundService } from './notification-sound.service';
import { InboxNotification, NotificationAudience, NotificationChannel } from './notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationInboxService {
  private readonly topicName = 'Notifications';
  private readonly itemsSubject = new BehaviorSubject<InboxNotification[]>([]);
  readonly items$ = this.itemsSubject.asObservable();
  private readonly unreadSubject = new BehaviorSubject(0);
  readonly unreadCount$ = this.unreadSubject.asObservable();
  private unsubscribe?: Unsubscribe;
  private watchedUserId = '';
  private primed = false;
  private knownIds = new Set<string>();
  private allItems: InboxNotification[] = [];

  constructor(
    private zone: NgZone,
    private sound: NotificationSoundService,
  ) {}

  get items(): InboxNotification[] {
    return this.allItems;
  }

  watch(userId: string): void {
    if (!userId || this.watchedUserId === userId) {
      return;
    }
    this.stop();
    this.watchedUserId = userId;
    this.primed = false;
    this.knownIds = new Set<string>();
    const inboxQuery = query(collection(firestore, this.topicName), where('userid', '==', userId));
    this.unsubscribe = onSnapshot(inboxQuery, (snapshot) => {
      this.zone.run(() =>
        this.applySnapshot(snapshot.docs.map((item) => this.map(item.id, item.data()))),
      );
    });
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.watchedUserId = '';
    this.primed = false;
    this.knownIds.clear();
    this.allItems = [];
    this.itemsSubject.next([]);
    this.unreadSubject.next(0);
  }

  async markRead(id: string): Promise<void> {
    await updateDoc(doc(firestore, this.topicName, id), { read: true });
  }

  async markAllRead(): Promise<void> {
    const unread = this.items.filter((item) => !item.read);
    const chunkSize = 400;
    for (let index = 0; index < unread.length; index += chunkSize) {
      const batch = writeBatch(firestore);
      unread.slice(index, index + chunkSize).forEach((item) => {
        batch.update(doc(firestore, this.topicName, item.id), { read: true });
      });
      await batch.commit();
    }
  }

  private applySnapshot(items: InboxNotification[]): void {
    const fresh = items.filter((item) => !item.read && !this.knownIds.has(item.id));
    items.forEach((item) => this.knownIds.add(item.id));
    if (this.primed && fresh.length > 0) {
      this.sound.play();
    }
    this.primed = true;
    const ordered = [...items].sort((left, right) => right.createdAtMs - left.createdAtMs);
    this.allItems = ordered;
    this.unreadSubject.next(ordered.filter((item) => !item.read).length);
    this.itemsSubject.next(ordered.slice(0, 40));
  }

  private map(id: string, data: Record<string, unknown>): InboxNotification {
    return {
      id,
      userid: String(data['userid'] || ''),
      channel: (data['channel'] as NotificationChannel) || NotificationChannel.InApp,
      audience: (data['audience'] as NotificationAudience) || NotificationAudience.Public,
      templateCode: String(data['templateCode'] || ''),
      subject: String(data['subject'] || ''),
      body: String(data['body'] || ''),
      summary: String(data['summary'] || ''),
      requestId: String(data['requestId'] || ''),
      requestType: String(data['requestType'] || ''),
      status: String(data['status'] || ''),
      moduleId: String(data['moduleId'] || ''),
      read: data['read'] === true,
      createdAtMs: Number(data['createdAtMs']) || 0,
    };
  }
}
