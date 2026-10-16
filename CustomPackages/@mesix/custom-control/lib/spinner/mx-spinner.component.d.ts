import { MxLoadingService } from './mx-loading.service';
import * as i0 from "@angular/core";
export declare class MxSpinnerComponent {
    loading: MxLoadingService;
    /** fixed = full page, local = relative to positioned parent */
    mode: 'fixed' | 'local';
    diameter: number;
    label: string;
    constructor(loading: MxLoadingService);
    static ɵfac: i0.ɵɵFactoryDeclaration<MxSpinnerComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MxSpinnerComponent, "mx-spinner", never, { "mode": { "alias": "mode"; "required": false; }; "diameter": { "alias": "diameter"; "required": false; }; "label": { "alias": "label"; "required": false; }; }, {}, never, never, true, never>;
}
