import { CommonModule } from '@angular/common';
import * as i0 from '@angular/core';
import { InjectionToken, Optional, Inject, Injectable, EventEmitter, ViewContainerRef, ViewChild, Output, Input, Component, NgModule, Directive } from '@angular/core';
import { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, Packer, Document } from 'docx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BehaviorSubject } from 'rxjs';

const MESIX_REPORT_PARAMETER_WINDOWS = new InjectionToken('MESIX_REPORT_PARAMETER_WINDOWS');
class ReportParameterWindowRegistry {
    windows = new Map();
    constructor(registrations) {
        for (const registration of registrations || [])
            this.register(registration.id, registration.component);
    }
    register(id, component) {
        if (this.windows.has(id))
            throw new Error(`A report parameter window is already registered for "${id}".`);
        this.windows.set(id, component);
    }
    resolve(id) {
        const component = this.windows.get(id);
        if (!component)
            throw new Error(`No report parameter window is registered for "${id}".`);
        return component;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportParameterWindowRegistry, deps: [{ token: MESIX_REPORT_PARAMETER_WINDOWS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportParameterWindowRegistry, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportParameterWindowRegistry, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [MESIX_REPORT_PARAMETER_WINDOWS]
                }] }] });

class ReportParameterWindowHostComponent {
    registry;
    windowId;
    initialValues = {};
    filtersChange = new EventEmitter();
    host;
    ready = false;
    constructor(registry) {
        this.registry = registry;
    }
    ngAfterViewInit() { this.ready = true; this.render(); }
    ngOnChanges(changes) { if (this.ready && (changes['windowId'] || changes['initialValues']))
        this.render(); }
    render() {
        if (!this.host || !this.windowId)
            return;
        this.host.clear();
        const component = this.registry.resolve(this.windowId);
        const ref = this.host.createComponent(component);
        ref.setInput('initialValues', this.initialValues);
        ref.instance.filtersChange.subscribe((filters) => this.filtersChange.emit(filters));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportParameterWindowHostComponent, deps: [{ token: ReportParameterWindowRegistry }], target: i0.ɵɵFactoryTarget.Component });
    static ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "19.2.25", type: ReportParameterWindowHostComponent, isStandalone: true, selector: "mx-report-parameter-window-host", inputs: { windowId: "windowId", initialValues: "initialValues" }, outputs: { filtersChange: "filtersChange" }, viewQueries: [{ propertyName: "host", first: true, predicate: ["host"], descendants: true, read: ViewContainerRef }], usesOnChanges: true, ngImport: i0, template: '<ng-container #host></ng-container>', isInline: true });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportParameterWindowHostComponent, decorators: [{
            type: Component,
            args: [{ selector: 'mx-report-parameter-window-host', standalone: true, template: '<ng-container #host></ng-container>' }]
        }], ctorParameters: () => [{ type: ReportParameterWindowRegistry }], propDecorators: { windowId: [{
                type: Input,
                args: [{ required: true }]
            }], initialValues: [{
                type: Input
            }], filtersChange: [{
                type: Output
            }], host: [{
                type: ViewChild,
                args: ['host', { read: ViewContainerRef }]
            }] } });

class MesixReportingModule {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: MesixReportingModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "19.2.25", ngImport: i0, type: MesixReportingModule, imports: [CommonModule, ReportParameterWindowHostComponent], exports: [ReportParameterWindowHostComponent] });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: MesixReportingModule, imports: [CommonModule] });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: MesixReportingModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [CommonModule, ReportParameterWindowHostComponent],
                    exports: [ReportParameterWindowHostComponent],
                }]
        }] });

const MESIX_REPORT_DEFINITIONS = new InjectionToken('MESIX_REPORT_DEFINITIONS');
class MesixReportRegistry {
    byId = new Map();
    constructor(definitions) {
        for (const definition of definitions || [])
            this.register(definition);
    }
    register(definition) {
        if (!definition.id.trim())
            throw new Error('A report definition requires a stable id.');
        if (this.byId.has(definition.id))
            throw new Error(`Report "${definition.id}" is already registered.`);
        this.byId.set(definition.id, definition);
    }
    getAll() { return [...this.byId.values()]; }
    getById(id) { return this.byId.get(id); }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: MesixReportRegistry, deps: [{ token: MESIX_REPORT_DEFINITIONS, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: MesixReportRegistry, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: MesixReportRegistry, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [MESIX_REPORT_DEFINITIONS]
                }] }] });

/** Stable IDs used by report definitions to select their parameter component. */
var ReportParameterWindowId;
(function (ReportParameterWindowId) {
    ReportParameterWindowId["Common"] = "common";
    ReportParameterWindowId["Inventory"] = "inventory";
    ReportParameterWindowId["Sales"] = "sales";
    ReportParameterWindowId["Purchase"] = "purchase";
    ReportParameterWindowId["CashFlow"] = "cash-flow";
    ReportParameterWindowId["LowStock"] = "low-stock";
    ReportParameterWindowId["InventoryValuation"] = "inventory-valuation";
    ReportParameterWindowId["StockMovement"] = "stock-movement";
    ReportParameterWindowId["DeadSlowStock"] = "dead-slow-stock";
    ReportParameterWindowId["SalesByProduct"] = "sales-by-product";
    ReportParameterWindowId["VendorPurchaseSummary"] = "vendor-purchase-summary";
    ReportParameterWindowId["CustomerSalesReturns"] = "customer-sales-returns";
    ReportParameterWindowId["DiscountImpact"] = "discount-impact";
    ReportParameterWindowId["TransferPerformance"] = "transfer-performance";
    ReportParameterWindowId["TransferFillRate"] = "transfer-fill-rate";
    ReportParameterWindowId["WorkflowAging"] = "workflow-aging";
    ReportParameterWindowId["BranchComparison"] = "branch-comparison";
    ReportParameterWindowId["ApproverThroughput"] = "approver-throughput";
})(ReportParameterWindowId || (ReportParameterWindowId = {}));

/** Base contract for consumer-owned filter components. */
class ReportParameterWindowComponent {
    initialValues = {};
    filtersChange = new EventEmitter();
    publishFilters(value) { this.filtersChange.emit(value); }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportParameterWindowComponent, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.2.25", type: ReportParameterWindowComponent, isStandalone: true, inputs: { initialValues: "initialValues" }, outputs: { filtersChange: "filtersChange" }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportParameterWindowComponent, decorators: [{
            type: Directive
        }], propDecorators: { initialValues: [{
                type: Input
            }], filtersChange: [{
                type: Output
            }] } });

class ReportExportService {
    activeWorker = null;
    async export(title, columns, rows, format, context = { header: [], aggregates: [] }) {
        if (typeof Worker !== 'undefined') {
            return new Promise((resolve, reject) => {
                const worker = new Worker(new URL('./report-export.worker.js', import.meta.url), { type: 'module' });
                this.activeWorker = worker;
                worker.onmessage = ({ data }) => {
                    worker.terminate();
                    if (this.activeWorker === worker)
                        this.activeWorker = null;
                    data.blob ? resolve(data.blob) : reject(new Error(data.error || 'Could not create the report file.'));
                };
                worker.onerror = (event) => { worker.terminate(); if (this.activeWorker === worker)
                    this.activeWorker = null; reject(new Error(event.message || 'Report export worker failed.')); };
                worker.postMessage({ title, columns, rows, format, context });
            });
        }
        const { createReportFile } = await Promise.resolve().then(function () { return reportExport_generator; });
        return createReportFile(title, columns, rows, format, context);
    }
    cancel() {
        this.activeWorker?.terminate();
        this.activeWorker = null;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportExportService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportExportService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportExportService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });

async function createReportFile(title, columns, rows, format, context = { header: [], aggregates: [] }) {
    const body = rows.map((row) => columns.map((column) => display(row[column.key], column.format, context.currencyCode)));
    const metadata = [
        ...(context.currencyName || context.currencyCode ? [`Currency: ${context.currencyName || context.currencyCode}${context.currencyName && context.currencyCode ? ` (${context.currencyCode})` : ''}`] : []),
        ...context.header.map((field) => `${field.label}: ${display(field.value)}`),
        ...context.aggregates.map((aggregate) => `${aggregate.label}: ${display(aggregate.value, aggregate.format, context.currencyCode)}`),
    ];
    if (format === 'xlsx') {
        const sheet = XLSX.utils.aoa_to_sheet([[title], ...metadata.map((item) => [item]), [], columns.map((column) => column.label), ...body]);
        sheet['!cols'] = columns.map((column) => ({ wch: Math.max(14, column.label.length + 3) }));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, 'Report');
        const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }
    if (format === 'docx') {
        const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                ...metadata.map((item) => new TableRow({ children: [new TableCell({ columnSpan: columns.length, children: [new Paragraph(item)] })] })),
                new TableRow({ children: columns.map((column) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: column.label, bold: true })] })] })) }),
                ...body.map((values) => new TableRow({ children: values.map((value) => new TableCell({ children: [new Paragraph(value)] })) })),
            ],
        });
        return Packer.toBlob(new Document({ sections: [{ children: [new Paragraph({ text: title, heading: 'Heading1' }), table] }] }));
    }
    const pdf = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });
    pdf.text(title, 14, 16);
    const metadataLines = metadata.slice(0, 8);
    if (metadataLines.length)
        pdf.text(metadataLines, 14, 22);
    autoTable(pdf, { startY: 26 + metadataLines.length * 5, head: [columns.map((column) => column.label)], body, styles: { fontSize: 8, cellPadding: 2 } });
    return pdf.output('blob');
}
function display(value, format, currencyCode) {
    if (value instanceof Date)
        return value.toLocaleDateString();
    if (value === null || value === undefined)
        return '';
    if (typeof value === 'number') {
        if (!Number.isFinite(value))
            return '';
        if (format === 'currency' && currencyCode) {
            try {
                return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(value);
            }
            catch { /* Fall through to a code-prefixed amount. */ }
        }
        return `${format === 'currency' && currencyCode ? `${currencyCode} ` : ''}${value.toLocaleString(undefined, { minimumFractionDigits: format === 'currency' ? 2 : 0, maximumFractionDigits: 2 })}`;
    }
    return String(value);
}

var reportExport_generator = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createReportFile: createReportFile
});

class ReportExportActivityService {
    exporter;
    generation = 0;
    subject = new BehaviorSubject({ state: 'idle', reportTitle: '', format: null, progress: 0, message: '' });
    activity$ = this.subject.asObservable();
    get busy() { return this.subject.value.state === 'loading'; }
    constructor(exporter) {
        this.exporter = exporter;
    }
    async start(title, columns, format, loadAll, loadContext = async () => ({ header: [], aggregates: [] })) {
        if (this.busy)
            throw new Error('Another report export is already in progress.');
        const generation = ++this.generation;
        this.subject.next({ state: 'loading', reportTitle: title, format, progress: 0, message: 'Preparing report…' });
        try {
            const [rows, context] = await Promise.all([loadAll((count) => {
                    if (generation === this.generation)
                        this.subject.next({ ...this.subject.value, progress: 0, message: `${count.toLocaleString()} rows loaded` });
                }), loadContext()]);
            if (generation !== this.generation)
                return;
            this.subject.next({ ...this.subject.value, message: `Creating ${format.toUpperCase()} file…` });
            const blob = await this.exporter.export(title, columns, rows, format, context);
            const fileName = `${this.safeName(title)}-${new Date().toISOString().slice(0, 10)}.${format}`;
            this.subject.next({ ...this.subject.value, state: 'ready', progress: 100, message: `${rows.length.toLocaleString()} rows ready`, blob, fileName });
        }
        catch (error) {
            if (generation !== this.generation)
                return;
            this.subject.next({ ...this.subject.value, state: 'error', message: error instanceof Error ? error.message : 'Report export failed.' });
        }
    }
    save() {
        const current = this.subject.value;
        if (!current.blob || !current.fileName)
            return;
        const url = URL.createObjectURL(current.blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = current.fileName;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
    }
    open() {
        const blob = this.subject.value.blob;
        if (blob) {
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener');
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        }
    }
    dismiss() { if (!this.busy)
        this.subject.next({ state: 'idle', reportTitle: '', format: null, progress: 0, message: '' }); }
    cancelAndDismiss() {
        this.generation++;
        this.exporter.cancel();
        this.subject.next({ state: 'idle', reportTitle: '', format: null, progress: 0, message: '' });
    }
    safeName(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report'; }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportExportActivityService, deps: [{ token: ReportExportService }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportExportActivityService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.2.25", ngImport: i0, type: ReportExportActivityService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: () => [{ type: ReportExportService }] });

/**
 * Generated bundle index. Do not edit.
 */

export { MESIX_REPORT_DEFINITIONS, MESIX_REPORT_PARAMETER_WINDOWS, MesixReportRegistry, MesixReportingModule, ReportExportActivityService, ReportExportService, ReportParameterWindowComponent, ReportParameterWindowHostComponent, ReportParameterWindowId, ReportParameterWindowRegistry, createReportFile };
//# sourceMappingURL=mesix-reporting.mjs.map
