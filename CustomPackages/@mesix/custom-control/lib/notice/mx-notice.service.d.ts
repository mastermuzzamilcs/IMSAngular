import { Type } from '@angular/core';
import { Observable } from 'rxjs';
import { MxContentDialogState, MxDialogRef, MxOpenDialogConfig } from './mx-dialog-ref';
import * as i0 from "@angular/core";
export type MxNoticeType = 'success' | 'warning' | 'error' | 'info';
export type MxDialogSize = 'compact' | 'wide' | 'auto';
export type { MxContentDialogState, MxDialogRef, MxOpenDialogConfig } from './mx-dialog-ref';
export { MX_DIALOG_DATA } from './mx-dialog-ref';
export interface MxToastOptions {
    type: MxNoticeType;
    message: string;
    durationMs?: number;
    onClose?: () => void;
}
export interface MxDialogInputOptions {
    label: string;
    placeholder?: string;
    required?: boolean;
    multiline?: boolean;
}
export interface MxDialogOptions {
    type: MxNoticeType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    input?: MxDialogInputOptions;
    size?: MxDialogSize;
    /** Extra CSS width, e.g. '480px' or '40rem' */
    width?: string;
    onConfirm?: (value?: string) => void;
    onCancel?: () => void;
}
export interface MxDialogResult {
    confirmed: boolean;
    value?: string;
}
export interface MxToastItem {
    id: number;
    type: MxNoticeType;
    message: string;
}
export interface MxDialogItem {
    id: number;
    type: MxNoticeType;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    showCancel: boolean;
    input?: MxDialogInputOptions;
    size?: MxDialogSize;
    width?: string;
}
export declare class MxNoticeService {
    private nextId;
    private toastTimers;
    private toastClosers;
    private readonly toastsSubject;
    readonly toasts$: Observable<MxToastItem[]>;
    private currentDialog;
    private readonly dialogQueue;
    private readonly dialogClosers;
    private readonly dialogSubject;
    readonly dialog$: Observable<MxDialogItem | null>;
    private readonly contentDialogsSubject;
    /** All open component dialogs (supports nesting). */
    readonly contentDialogs$: Observable<MxContentDialogState[]>;
    toast(options: MxToastOptions): Observable<void>;
    dismissToast(id: number): void;
    /**
     * Open an Angular component inside the Mesix dialog shell (flexible width, no horizontal scroll).
     * Supports stacking for nested dialogs. Component should inject MxDialogRef + MX_DIALOG_DATA.
     */
    open<T, R = any>(component: Type<T>, config?: MxOpenDialogConfig): MxDialogRef<R>;
    dismissContentDialog(id?: number): void;
    dialog(options: MxDialogOptions): Observable<MxDialogResult>;
    confirmDialog(value?: string): void;
    cancelDialog(): void;
    private showDialog;
    private finishDialog;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxNoticeService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<MxNoticeService>;
}
