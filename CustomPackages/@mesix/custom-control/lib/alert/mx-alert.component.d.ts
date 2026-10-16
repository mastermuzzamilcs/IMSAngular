import { EventEmitter } from '@angular/core';
import { MxTone } from '../shared/mx-control.types';
import * as i0 from "@angular/core";
export declare class MxAlertComponent {
    tone: MxTone;
    title: string;
    icon: string;
    dismissible: boolean;
    dismissed: EventEmitter<void>;
    get iconName(): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxAlertComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MxAlertComponent, "mx-alert", never, { "tone": { "alias": "tone"; "required": false; }; "title": { "alias": "title"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "dismissible": { "alias": "dismissible"; "required": false; }; }, { "dismissed": "dismissed"; }, never, ["*"], true, never>;
}
