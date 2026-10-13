import { MxDialogItem, MxNoticeService, MxNoticeType } from './mx-notice.service';
import * as i0 from "@angular/core";
export declare class MxDialogHostComponent {
    notice: MxNoticeService;
    draft: string;
    private draftDialogId;
    private readonly destroyRef;
    constructor(notice: MxNoticeService);
    iconFor(type: MxNoticeType): string;
    confirmDisabled(dialog: MxDialogItem): boolean;
    confirm(dialog: MxDialogItem): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxDialogHostComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MxDialogHostComponent, "mx-dialog-host", never, {}, {}, never, never, true, never>;
}
