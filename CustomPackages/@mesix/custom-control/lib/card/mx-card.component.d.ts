import { MxControlSize } from '../shared/mx-control.types';
import * as i0 from "@angular/core";
export declare class MxCardComponent {
    title: string;
    subtitle: string;
    padding: MxControlSize;
    elevation: 'flat' | 'elevated';
    clickable: boolean;
    hasFooter: boolean;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxCardComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MxCardComponent, "mx-card", never, { "title": { "alias": "title"; "required": false; }; "subtitle": { "alias": "subtitle"; "required": false; }; "padding": { "alias": "padding"; "required": false; }; "elevation": { "alias": "elevation"; "required": false; }; "clickable": { "alias": "clickable"; "required": false; }; "hasFooter": { "alias": "hasFooter"; "required": false; }; }, {}, never, ["[mxCardActions]", "*", "[mxCardFooter]"], true, never>;
}
