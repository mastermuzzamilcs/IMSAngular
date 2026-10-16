import { OnChanges, OnInit, SimpleChanges } from '@angular/core';
import * as i0 from "@angular/core";
/**
 * Placeholder table rows with shimmer bars for data-grid loading states.
 * Use standalone or via `mx-grid` `[loading]`.
 */
export declare class MxTableSkeletonComponent implements OnInit, OnChanges {
    /** Number of columns (ignored when `columnWidths` is set). */
    columns: number;
    /** Placeholder row count. */
    rows: number;
    /** Optional per-column flex share / max width percentages. */
    columnWidths: number[] | null;
    showHeader: boolean;
    ariaLabel: string;
    widths: number[];
    rowSlots: number[];
    ngOnInit(): void;
    ngOnChanges(_changes: SimpleChanges): void;
    flexFor(width: number): string;
    barWidth(colIndex: number): number;
    delayFor(colIndex: number): number;
    private syncSlots;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxTableSkeletonComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MxTableSkeletonComponent, "mx-table-skeleton", never, { "columns": { "alias": "columns"; "required": false; }; "rows": { "alias": "rows"; "required": false; }; "columnWidths": { "alias": "columnWidths"; "required": false; }; "showHeader": { "alias": "showHeader"; "required": false; }; "ariaLabel": { "alias": "ariaLabel"; "required": false; }; }, {}, never, never, true, never>;
}
