import { InjectionToken, Type } from '@angular/core';
import { ReportParameterWindowComponent } from './report-parameter-window.component';
import { ReportParameterWindowId } from './report-parameter-window-id';
import * as i0 from "@angular/core";
export interface ReportParameterWindowRegistration {
    id: ReportParameterWindowId;
    component: Type<ReportParameterWindowComponent>;
}
export declare const MESIX_REPORT_PARAMETER_WINDOWS: InjectionToken<ReportParameterWindowRegistration[]>;
export declare class ReportParameterWindowRegistry {
    private readonly windows;
    constructor(registrations: ReportParameterWindowRegistration[] | null);
    register(id: ReportParameterWindowId, component: Type<ReportParameterWindowComponent>): void;
    resolve(id: ReportParameterWindowId): Type<ReportParameterWindowComponent>;
    static ɵfac: i0.ɵɵFactoryDeclaration<ReportParameterWindowRegistry, [{ optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ReportParameterWindowRegistry>;
}
//# sourceMappingURL=report-parameter-window.registry.d.ts.map