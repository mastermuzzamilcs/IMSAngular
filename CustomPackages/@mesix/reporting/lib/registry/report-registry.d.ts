import { InjectionToken } from '@angular/core';
import { ReportDefinition } from '../reporting.models';
import * as i0 from "@angular/core";
export declare const MESIX_REPORT_DEFINITIONS: InjectionToken<ReportDefinition<Record<string, import("@mesix/reporting").ReportValue>>[]>;
export declare class MesixReportRegistry {
    private readonly byId;
    constructor(definitions: ReportDefinition[] | null);
    register(definition: ReportDefinition): void;
    getAll(): ReportDefinition[];
    getById(id: string): ReportDefinition | undefined;
    static ɵfac: i0.ɵɵFactoryDeclaration<MesixReportRegistry, [{ optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<MesixReportRegistry>;
}
//# sourceMappingURL=report-registry.d.ts.map