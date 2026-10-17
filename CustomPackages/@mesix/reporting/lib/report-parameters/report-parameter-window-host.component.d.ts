import { AfterViewInit, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ReportParameterWindowId } from './report-parameter-window-id';
import { ReportParameterWindowRegistry } from './report-parameter-window.registry';
import * as i0 from "@angular/core";
export declare class ReportParameterWindowHostComponent implements AfterViewInit, OnChanges {
    private registry;
    windowId: ReportParameterWindowId;
    initialValues: Record<string, unknown>;
    readonly filtersChange: EventEmitter<Record<string, unknown>>;
    private host?;
    private ready;
    constructor(registry: ReportParameterWindowRegistry);
    ngAfterViewInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    private render;
    static ɵfac: i0.ɵɵFactoryDeclaration<ReportParameterWindowHostComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<ReportParameterWindowHostComponent, "mx-report-parameter-window-host", never, { "windowId": { "alias": "windowId"; "required": true; }; "initialValues": { "alias": "initialValues"; "required": false; }; }, { "filtersChange": "filtersChange"; }, never, never, true, never>;
}
//# sourceMappingURL=report-parameter-window-host.component.d.ts.map