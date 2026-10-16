import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Drive-style data grid shell.
 * Set `showFilter` to offer a search field that filters across projected table content
 * (consumers typically bind filterChange to MatTableDataSource.filter).
 * Set `loading` to show an in-grid table skeleton without destroying projected content.
 */
export declare class MxGridComponent {
    /** Show Drive-style search box that filters grid text. */
    showFilter: boolean;
    filterPlaceholder: string;
    filter: string;
    elevated: boolean;
    hasToolbar: boolean;
    hasFooter: boolean;
    /** When true, shows `mx-table-skeleton` and hides projected table content. */
    loading: boolean;
    skeletonColumns: number;
    skeletonRows: number;
    skeletonColumnWidths: number[] | null;
    filterChange: EventEmitter<string>;
    onFilter(value: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxGridComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MxGridComponent, "mx-grid", never, { "showFilter": { "alias": "showFilter"; "required": false; }; "filterPlaceholder": { "alias": "filterPlaceholder"; "required": false; }; "filter": { "alias": "filter"; "required": false; }; "elevated": { "alias": "elevated"; "required": false; }; "hasToolbar": { "alias": "hasToolbar"; "required": false; }; "hasFooter": { "alias": "hasFooter"; "required": false; }; "loading": { "alias": "loading"; "required": false; }; "skeletonColumns": { "alias": "skeletonColumns"; "required": false; }; "skeletonRows": { "alias": "skeletonRows"; "required": false; }; "skeletonColumnWidths": { "alias": "skeletonColumnWidths"; "required": false; }; }, { "filterChange": "filterChange"; }, never, ["[mxGridActions]", "*", "[mxGridFooter]"], true, never>;
}
