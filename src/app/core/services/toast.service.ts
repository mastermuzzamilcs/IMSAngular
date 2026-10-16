import { Injectable, inject } from '@angular/core';
import { MxNoticeService, MxNoticeType } from '@mesix/custom-control';

/** Mesix-backed toasts for IMS screens (replaces browser alert / snackbar). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly notice = inject(MxNoticeService);

  success(message: string, durationMs?: number): void {
    this.show('success', message, durationMs);
  }

  error(message: string, durationMs?: number): void {
    this.show('error', message, durationMs);
  }

  warning(message: string, durationMs?: number): void {
    this.show('warning', message, durationMs);
  }

  info(message: string, durationMs?: number): void {
    this.show('info', message, durationMs);
  }

  private show(type: MxNoticeType, message: string, durationMs?: number): void {
    this.notice.toast({ type, message, durationMs });
  }
}
