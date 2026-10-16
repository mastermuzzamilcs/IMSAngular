import { InjectionToken, Type } from '@angular/core';
import { Observable } from 'rxjs';
/** Data passed into a component opened via MxNoticeService.open(). */
export declare const MX_DIALOG_DATA: InjectionToken<unknown>;
export interface MxOpenDialogConfig {
    data?: unknown;
    /** When true, backdrop click does not close the dialog. */
    disableClose?: boolean;
}
export interface MxContentDialogState {
    id: number;
    component: Type<unknown>;
    data: unknown;
    ref: MxDialogRef<unknown>;
    disableClose: boolean;
}
/** Handle returned from MxNoticeService.open() — mirrors MatDialogRef close API. */
export declare class MxDialogRef<T = any> {
    private readonly onDismiss;
    private readonly closedSubject;
    private settled;
    constructor(onDismiss: () => void);
    afterClosed(): Observable<T | undefined>;
    close(result?: T): void;
}
