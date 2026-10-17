import { ReportParameterWindowId } from './report-parameters/report-parameter-window-id';
export type ReportValue = string | number | boolean | Date | null | undefined;
export interface ReportColumn {
    key: string;
    label: string;
    format?: 'currency' | 'date' | 'number';
}
export interface ReportFilterDefinition {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: {
        label: string;
        value: string | number;
    }[];
    placeholder?: string;
}
export interface ReportFilters {
    branchId: string;
    fromDate: Date | string | null;
    toDate: Date | string | null;
    search: string;
    customValues?: Record<string, ReportValue>;
}
export interface ReportPageRequest {
    filters: ReportFilters;
    pageIndex: number;
    pageSize: number;
}
export interface ReportPage<T = Record<string, ReportValue>> {
    rows: T[];
    total: number;
}
export interface ReportHeaderField {
    label: string;
    value: ReportValue;
}
export interface ReportAggregate {
    key: string;
    label: string;
    value: ReportValue;
    format?: ReportColumn['format'];
    detail?: string;
}
export interface ReportExportContext {
    header: ReportHeaderField[];
    aggregates: ReportAggregate[];
    currencyName?: string;
    currencyCode?: string;
}
export interface ReportDefinition<T = Record<string, ReportValue>> {
    id: string;
    title: string;
    description: string;
    columns: ReportColumn[];
    filters?: ReportFilterDefinition[];
    parameterWindowId: ReportParameterWindowId;
    /** Filter-aware fields rendered in the report header and included in exports. */
    header?: (filters: ReportFilters) => ReportHeaderField[];
    /** Report-specific totals for all matching records, independent of the current grid page. */
    loadAggregates?: (filters: ReportFilters) => Promise<ReportAggregate[]>;
    loadPage(request: ReportPageRequest): Promise<ReportPage<T>>;
    loadAll(filters: ReportFilters, onProgress?: (loaded: number) => void): Promise<T[]>;
}
//# sourceMappingURL=reporting.models.d.ts.map