import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/services/auth.service';
import { BranchService } from '../../core/services/branchservice.service';
import { ImsReportCatalogService } from '../../core/reporting/ims-report-catalog.service';
import { ReportExportActivityService, ReportDefinition, ReportFilters, ReportValue, ReportAggregate, ReportHeaderField, MesixReportRegistry, ReportParameterWindowRegistry, MESIX_REPORT_PARAMETER_WINDOWS, ReportParameterWindowId, MesixReportingModule } from '@mesix/reporting';
import { CashTransactionInput, CashTransactionService, CashTransactionType } from '../../core/reporting/cash-transaction.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingService } from '../../core/services/Loading.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { ActivatedRoute } from '@angular/router';
import { AnalyticsReportParametersComponent, CashFlowReportParametersComponent } from './report-parameter-windows';

@Component({
  selector: 'app-report-center', standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule, MatPaginatorModule, MatSelectModule, MesixReportingModule],
  providers: [
    ReportParameterWindowRegistry,
    { provide: MESIX_REPORT_PARAMETER_WINDOWS, multi: true, useValue: { id: ReportParameterWindowId.Inventory, component: AnalyticsReportParametersComponent } },
    { provide: MESIX_REPORT_PARAMETER_WINDOWS, multi: true, useValue: { id: ReportParameterWindowId.Sales, component: AnalyticsReportParametersComponent } },
    { provide: MESIX_REPORT_PARAMETER_WINDOWS, multi: true, useValue: { id: ReportParameterWindowId.Purchase, component: AnalyticsReportParametersComponent } },
    { provide: MESIX_REPORT_PARAMETER_WINDOWS, multi: true, useValue: { id: ReportParameterWindowId.CashFlow, component: CashFlowReportParametersComponent } },
    ...[
      ReportParameterWindowId.LowStock, ReportParameterWindowId.InventoryValuation, ReportParameterWindowId.StockMovement, ReportParameterWindowId.DeadSlowStock,
      ReportParameterWindowId.SalesByProduct, ReportParameterWindowId.VendorPurchaseSummary, ReportParameterWindowId.CustomerSalesReturns, ReportParameterWindowId.DiscountImpact,
      ReportParameterWindowId.TransferPerformance, ReportParameterWindowId.TransferFillRate, ReportParameterWindowId.WorkflowAging, ReportParameterWindowId.BranchComparison, ReportParameterWindowId.ApproverThroughput,
    ].map((id) => ({ provide: MESIX_REPORT_PARAMETER_WINDOWS, multi: true, useValue: { id, component: AnalyticsReportParametersComponent } })),
  ],
  templateUrl: './report-center.component.html', styleUrl: './report-center.component.scss',
})
export class ReportCenterComponent implements OnInit {
  readonly reports: ReportDefinition[];
  branches: any[];
  selectedId = 'inventory-on-hand';
  filters: ReportFilters = { branchId: '', fromDate: null, toDate: null, search: '' };
  rows: Record<string, ReportValue>[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 25;
  loading = false;
  error = '';
  loaded = false;
  aggregates: ReportAggregate[] = [];
  cashEntryOpen = false;
  cashSaving = false;
  cashDate = new Date();
  cashEntry: CashTransactionInput = { branchId: '', branchName: '', transactionDate: new Date().toISOString().slice(0, 10), type: 'Receipt', amount: 0, category: '' };
  private parameterValuesSnapshot: Record<string, unknown> = {};
  private parameterValuesKey = '';
  readonly cashTypes: CashTransactionType[] = ['Receipt', 'Payment', 'Other income', 'Expense', 'Owner contribution', 'Owner withdrawal'];

  constructor(private catalog: ImsReportCatalogService, private auth: AuthService, private branchService: BranchService, readonly exports: ReportExportActivityService, private cashTransactions: CashTransactionService, private toast: ToastService, private loadingService: LoadingService, private route: ActivatedRoute, private registry: MesixReportRegistry, readonly settings: AppSettingsService) {
    for (const definition of catalog.definitions) {
      try { registry.register(definition); } catch { /* Preserve registrations when navigating back to the report center. */ }
    }
    this.reports = registry.getAll();
    this.branches = auth.currentSession()?.branches || [];
    if (this.branches.some((branch) => branch.branchid === '0')) {
      void this.branchService.getBranches().then((branches) => { this.branches = branches; }).catch(() => this.toast.error('Branch list could not be loaded.'));
    }
    this.filters.branchId = auth.currentBranchId() === '0' ? '' : auth.currentBranchId();
    this.cashEntry.branchId = this.filters.branchId;
    this.cashEntry.branchName = this.branches.find((branch) => branch.branchid === this.cashEntry.branchId)?.name || '';
  }

  get report(): ReportDefinition { return this.reports.find((item) => item.id === this.selectedId) || this.reports[0]; }
  get columns() { return this.report.columns; }
  get parameterWindowId(): ReportParameterWindowId { return this.report.parameterWindowId; }
  get parameterValues(): Record<string, unknown> {
    const next = { reportId: this.report.id, branchId: this.filters.branchId, fromDate: this.filters.fromDate || '', toDate: this.filters.toDate || '', ...(this.filters.customValues || {}) };
    const key = JSON.stringify(next);
    if (key !== this.parameterValuesKey) { this.parameterValuesKey = key; this.parameterValuesSnapshot = next; }
    return this.parameterValuesSnapshot;
  }
  get headerFields(): ReportHeaderField[] { return this.report.header?.(this.filters) || []; }

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const reportId = String(data['reportId'] || 'inventory-on-hand');
      if (this.reports.some((report) => report.id === reportId)) {
        this.selectedId = reportId;
        const branchId = this.auth.currentBranchId();
        this.filters = { branchId: branchId === '0' ? '' : branchId, fromDate: null, toDate: null, search: '', customValues: {} };
        this.rows = []; this.total = 0; this.aggregates = []; this.loaded = false; this.pageIndex = 0;
      }
    });
  }
  async load(pageIndex = 0): Promise<void> {
    if (!this.report) return;
    const invalidRange = this.invalidDateRange();
    if (invalidRange) { this.toast.warning(invalidRange); return; }
    this.loading = true; this.error = ''; this.pageIndex = pageIndex;
    this.loadingService.show();
    this.rows = []; this.total = 0; this.aggregates = []; this.loaded = false;
    try {
      const [page, aggregates] = await Promise.all([
        this.report.loadPage({ filters: { ...this.filters }, pageIndex, pageSize: this.pageSize }),
        this.report.loadAggregates?.({ ...this.filters }) || Promise.resolve([]),
      ]);
      this.rows = page.rows; this.total = page.total; this.aggregates = aggregates; this.loaded = true;
    }
    catch (error) { this.error = error instanceof Error ? error.message : 'Unable to load this report.'; this.toast.error(this.error); this.rows = []; this.total = 0; this.aggregates = []; }
    finally { this.loading = false; this.loadingService.hide(); }
  }
  async page(event: PageEvent): Promise<void> { this.pageSize = event.pageSize; await this.load(event.pageIndex); }
  async export(format: 'xlsx' | 'docx' | 'pdf'): Promise<void> {
    const invalidRange = this.invalidDateRange();
    if (invalidRange) { this.toast.warning(invalidRange); return; }
    const filters = { ...this.filters, customValues: { ...(this.filters.customValues || {}) } };
    await this.exports.start(this.report.title, this.columns, format, (progress) => this.report.loadAll(filters, progress), async () => ({
      header: this.report.header?.(filters) || [],
      aggregates: await this.report.loadAggregates?.(filters) || [],
      currencyName: this.settings.currencyName,
      currencyCode: this.settings.currencyCode,
    }));
  }
  onParameterFilters(values: Record<string, unknown>): void {
    const { branchId, fromDate, toDate, ...customValues } = values;
    this.filters = { branchId: String(branchId || ''), fromDate: String(fromDate || '') || null, toDate: String(toDate || '') || null, search: '', customValues: customValues as Record<string, ReportValue> };
    this.rows = []; this.total = 0; this.aggregates = []; this.loaded = false; this.pageIndex = 0;
  }
  async saveCashEntry(): Promise<void> {
    this.cashSaving = true;
    try {
      this.cashEntry.branchName = this.branches.find((branch) => branch.branchid === this.cashEntry.branchId)?.name || '';
      await this.cashTransactions.record({ ...this.cashEntry });
      const branchId = this.auth.currentBranchId();
      this.toast.success('Cash transaction recorded'); this.cashEntry = { branchId: branchId === '0' ? '' : branchId, branchName: '', transactionDate: new Date().toISOString().slice(0, 10), type: 'Receipt', amount: 0, category: '' };
      this.cashEntry.branchName = this.branches.find((branch) => branch.branchid === this.cashEntry.branchId)?.name || '';
      this.cashDate = new Date();
    } catch (error) { this.toast.error(error instanceof Error ? error.message : 'Cash transaction could not be saved.'); }
    finally { this.cashSaving = false; }
  }
  setCashDate(date: Date | null): void {
    if (date) this.cashEntry.transactionDate = this.toDateString(date);
  }
  private toDateString(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  private invalidDateRange(): string | null {
    const ranges: Array<[string, string, string]> = [
      ['fromDate', 'toDate', 'Report start date must be on or before the end date.'],
      ['expectedFrom', 'expectedTo', 'Expected start date must be on or before the expected end date.'],
    ];
    for (const [startKey, endKey, message] of ranges) {
      const start = String(startKey === 'fromDate' ? this.filters.fromDate || '' : this.filters.customValues?.[startKey] || '').slice(0, 10);
      const end = String(endKey === 'toDate' ? this.filters.toDate || '' : this.filters.customValues?.[endKey] || '').slice(0, 10);
      if (start && end && start > end) return message;
    }
    return null;
  }
  display(value: ReportValue, format?: string): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date || format === 'date') { const date = value instanceof Date ? value : new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(); }
    if (typeof value === 'number') return format === 'currency' ? this.settings.formatCurrency(value) : value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return String(value);
  }
}
