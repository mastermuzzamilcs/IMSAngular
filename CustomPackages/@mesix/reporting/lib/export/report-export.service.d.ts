import { ReportColumn, ReportExportContext } from '../reporting.models';
import * as i0 from "@angular/core";
export type ReportExportFormat = 'xlsx' | 'docx' | 'pdf';
export declare class ReportExportService {
    private activeWorker;
    export(title: string, columns: ReportColumn[], rows: Record<string, unknown>[], format: ReportExportFormat, context?: ReportExportContext): Promise<Blob>;
    cancel(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<ReportExportService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ReportExportService>;
}
//# sourceMappingURL=report-export.service.d.ts.map