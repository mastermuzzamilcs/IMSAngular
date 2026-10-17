import { EventEmitter } from '@angular/core';
import * as i0 from "@angular/core";
/** Base contract for consumer-owned filter components. */
export declare abstract class ReportParameterWindowComponent<T extends Record<string, unknown> = Record<string, unknown>> {
    initialValues: Partial<T>;
    readonly filtersChange: EventEmitter<T>;
    protected publishFilters(value: T): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<ReportParameterWindowComponent<any>, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<ReportParameterWindowComponent<any>, never, never, { "initialValues": { "alias": "initialValues"; "required": false; }; }, { "filtersChange": "filtersChange"; }, never, never, true, never>;
}
//# sourceMappingURL=report-parameter-window.component.d.ts.map