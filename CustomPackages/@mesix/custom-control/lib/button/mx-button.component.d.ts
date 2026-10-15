import { EventEmitter } from '@angular/core';
import { MxButtonVariant, MxControlSize, MxTone } from '../shared/mx-control.types';
import * as i0 from "@angular/core";
/**
 * Drive-style actions — every non-link state keeps a visible 1px border.
 * - solid + primary  → filled primary (default)
 * - outline          → secondary / Cancel
 */
export declare class MxButtonComponent {
    variant: MxButtonVariant;
    tone: MxTone;
    size: MxControlSize;
    type: 'button' | 'submit' | 'reset';
    icon: string;
    iconOnly: boolean;
    block: boolean;
    disabled: boolean;
    loading: boolean;
    pressed: EventEmitter<MouseEvent>;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxButtonComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MxButtonComponent, "mx-button", never, { "variant": { "alias": "variant"; "required": false; }; "tone": { "alias": "tone"; "required": false; }; "size": { "alias": "size"; "required": false; }; "type": { "alias": "type"; "required": false; }; "icon": { "alias": "icon"; "required": false; }; "iconOnly": { "alias": "iconOnly"; "required": false; }; "block": { "alias": "block"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; }, { "pressed": "pressed"; }, never, ["*"], true, never>;
}
