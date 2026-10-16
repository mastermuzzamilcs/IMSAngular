import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { MxNoticeService } from '@mesix/custom-control';

/** Mesix-backed confirm/delete dialogs for IMS screens. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly notice = inject(MxNoticeService);

  confirmDelete(message: string, title = 'Confirm delete'): Observable<boolean> {
    return this.notice
      .dialog({
        type: 'warning',
        title,
        message,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      })
      .pipe(map((result) => result.confirmed));
  }

  confirm(options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'success' | 'warning' | 'error' | 'info';
  }): Observable<boolean> {
    return this.notice
      .dialog({
        type: options.type ?? 'warning',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? 'Confirm',
        cancelText: options.cancelText ?? 'Cancel',
      })
      .pipe(map((result) => result.confirmed));
  }
}
