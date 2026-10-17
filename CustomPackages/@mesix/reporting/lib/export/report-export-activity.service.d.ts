import { ReportColumn, ReportExportContext } from '../reporting.models';
import { ReportExportFormat, ReportExportService } from './report-export.service';
import * as i0 from "@angular/core";
export type ExportState = 'idle' | 'loading' | 'ready' | 'error';
export interface ExportActivity {
    state: ExportState;
    reportTitle: string;
    format: ReportExportFormat | null;
    progress: number;
    message: string;
    blob?: Blob;
    fileName?: string;
}
export declare class ReportExportActivityService {
    private exporter;
    private generation;
    private readonly subject;
    readonly activity$: import("rxjs").Observable<ExportActivity>;
    get busy(): boolean;
    constructor(exporter: ReportExportService);
    start<T extends Record<string, unknown>>(title: string, columns: ReportColumn[], format: ReportExportFormat, loadAll: (progress: (count: number) => void) => Promise<T[]>, loadContext?: () => Promise<ReportExportContext>): Promise<void>;
    save(): void;
    open(): void;
    dismiss(): void;
    cancelAndDismiss(): void;
    private safeName;
    static ɵfac: i0.ɵɵFactoryDeclaration<ReportExportActivityService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ReportExportActivityService>;
}
//# sourceMappingURL=report-export-activity.service.d.ts.map