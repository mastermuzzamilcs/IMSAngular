import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Drive-style data grid shell.
 * Set `showFilter` to offer a search field that filters across projected table content
 * (consumers typically bind filterChange to MatTableDataSource.filter).
 */
export declare class MxGridComponent {
    /** Show Drive-style search box that filters grid text. */
    showFilter: boolean;
    filterPlaceholder: string;
    filter: string;
    elevated: boolean;
    hasToolbar: boolean;
    hasFooter: boolean;
    filterChange: EventEmitter<string>;
    onFilter(value: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxGridComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MxGridComponent, "mx-grid", never, { "showFilter": { "alias": "showFilter"; "required": false; }; "filterPlaceholder": { "alias": "filterPlaceholder"; "required": false; }; "filter": { "alias": "filter"; "required": false; }; "elevated": { "alias": "elevated"; "required": false; }; "hasToolbar": { "alias": "hasToolbar"; "required": false; }; "hasFooter": { "alias": "hasFooter"; "required": false; }; }, { "filterChange": "filterChange"; }, never, ["[mxGridActions]", "*", "[mxGridFooter]"], true, never>;
}
