import { Injector } from '@angular/core';
import { MxContentDialogState, MxDialogItem, MxNoticeService, MxNoticeType } from './mx-notice.service';
import * as i0 from "@angular/core";
export declare class MxDialogHostComponent {
    notice: MxNoticeService;
    draft: string;
    contentDialogs: MxContentDialogState[];
    private draftDialogId;
    private readonly destroyRef;
    private readonly parentInjector;
    private readonly injectors;
    constructor(notice: MxNoticeService);
    injectorFor(state: MxContentDialogState): Injector;
    iconFor(type: MxNoticeType): string;
    confirmDisabled(dialog: MxDialogItem): boolean;
    confirm(dialog: MxDialogItem): void;
    onContentBackdrop(state: MxContentDialogState): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxDialogHostComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MxDialogHostComponent, "mx-dialog-host", never, {}, {}, never, never, true, never>;
}
