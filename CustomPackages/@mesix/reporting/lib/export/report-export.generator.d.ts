import { ReportColumn, ReportExportContext } from '../reporting.models';
import type { ReportExportFormat } from './report-export.service';
export declare function createReportFile(title: string, columns: ReportColumn[], rows: Record<string, unknown>[], format: ReportExportFormat, context?: ReportExportContext): Promise<Blob>;
//# sourceMappingURL=report-export.generator.d.ts.map