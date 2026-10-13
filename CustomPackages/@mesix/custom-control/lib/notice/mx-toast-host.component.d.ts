import { MxNoticeService, MxNoticeType } from './mx-notice.service';
import * as i0 from "@angular/core";
export declare class MxToastHostComponent {
    notice: MxNoticeService;
    /** Where toasts appear */
    position: 'top-right' | 'top-left' | 'top-center';
    constructor(notice: MxNoticeService);
    iconFor(type: MxNoticeType): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxToastHostComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MxToastHostComponent, "mx-toast-host", never, { "position": { "alias": "position"; "required": false; }; }, {}, never, never, true, never>;
}
