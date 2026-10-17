import { CommonModule } from '@angular/common';
import { Component, Directive, OnChanges, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AuthService } from '../../core/services/auth.service';
import { BranchService } from '../../core/services/branchservice.service';
import { BrandService } from '../../core/services/brand.service';
import { CustomerService } from '../../core/services/customer.service';
import { ProductService } from '../../core/services/product.service';
import { VendorService } from '../../core/services/vendor.service';
import { UsersService } from '../../core/services/users.service';
import { ToastService } from '../../core/services/toast.service';
import { ReportParameterWindowComponent } from '@mesix/reporting';
import { SessionBranch } from '../../core/Models/AuthSession';
import { Product } from '../../core/Models/ProductModel';
import { Brand } from '../../core/Models/BrandModel';
import { Customer } from '../../core/Models/CustomerModel';
import { Vendor } from '../../core/Models/VendorModel';
import { User } from '../../core/Models/UsersModel';

const imports = [
  CommonModule,
  FormsModule,
  MatButtonModule,
  MatDatepickerModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatSelectModule,
];
const windowStyles = `:host{display:contents}.report-parameters{display:contents}.report-parameters mat-form-field{width:100%;margin:0}.report-parameters button{height:56px;min-width:148px;white-space:nowrap}.filter-hint{font-size:11px;color:#64748b;grid-column:1/-1}`;
const stableDates = new Map<string, Date>();

/** Return the same Date instance for a date string so ngModel does not retrigger change detection. */
function stableDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value).slice(0, 10);
  const cached = stableDates.get(text);
  if (cached) return cached;
  const parts = text.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  stableDates.set(text, date);
  return date;
}

interface AnalyticsFilter {
  key: string;
  label: string;
  type: 'select' | 'date' | 'number' | 'text';
  source?: string;
  options?: { id: string; label: string }[];
}

interface ParameterValues extends Record<string, unknown> {
  branchId?: string;
  productId?: string;
  brandId?: string;
  customerId?: string;
  vendorId?: string;
  fromDate?: string | Date | null;
  toDate?: string | Date | null;
  movementType?: string;
  party?: string;
}
const analyticsFilters: Record<string, AnalyticsFilter[]> = {
  'inventory-on-hand': [
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    { key: 'productId', label: 'Product', type: 'select', source: 'products' },
    { key: 'brandId', label: 'Brand', type: 'select', source: 'brands' },
    {
      key: 'alert',
      label: 'Stock alert',
      type: 'select',
      options: ['Empty', 'Low', 'Healthy'].map((id) => ({ id, label: id })),
    },
    { key: 'fromDate', label: 'Updated from', type: 'date' },
    { key: 'toDate', label: 'Updated to', type: 'date' },
  ],
  'sales-summary': [
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    { key: 'fromDate', label: 'From date', type: 'date' },
    { key: 'toDate', label: 'To date', type: 'date' },
    { key: 'brandId', label: 'Brand', type: 'select', source: 'brands' },
    { key: 'customerId', label: 'Customer', type: 'select', source: 'customers' },
    { key: 'status', label: 'Status', type: 'select', source: 'statuses' },
  ],
  'low-stock': [
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    { key: 'brandId', label: 'Brand', type: 'select', source: 'brands' },
    { key: 'productId', label: 'Product', type: 'select', source: 'products' },
    {
      key: 'alert',
      label: 'Alert',
      type: 'select',
      options: ['Empty', 'Low', 'Healthy'].map((id) => ({ id, label: id })),
    },
    { key: 'threshold', label: 'Low-stock threshold', type: 'number' },
  ],
  'inventory-valuation': [
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    { key: 'brandId', label: 'Brand', type: 'select', source: 'brands' },
    { key: 'productId', label: 'Product', type: 'select', source: 'products' },
    { key: 'asOfDate', label: 'Last updated on', type: 'date' },
    {
      key: 'basis',
      label: 'Valuation basis',
      type: 'select',
      options: [
        { id: 'on-hand', label: 'On-hand quantity' },
        { id: 'available', label: 'Available quantity' },
      ],
    },
  ],
  'stock-movement': [
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    {
      key: 'stocktype',
      label: 'Stock type',
      type: 'select',
      options: [
        { id: '', label: 'All movements' },
        { id: 'in', label: 'Inbound' },
        { id: 'out', label: 'Outbound' },
      ],
    },
    { key: 'status', label: 'Status', type: 'select', source: 'statuses' },
    { key: 'vendorId', label: 'Vendor', type: 'select', source: 'vendors' },
    { key: 'customerId', label: 'Customer', type: 'select', source: 'customers' },
    { key: 'fromDate', label: 'From date', type: 'date' },
    { key: 'toDate', label: 'To date', type: 'date' },
    { key: 'productId', label: 'Product', type: 'select', source: 'products' },
    { key: 'reason', label: 'Reason', type: 'text' },
  ],
  'dead-slow-stock': [
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    { key: 'brandId', label: 'Brand', type: 'select', source: 'brands' },
    { key: 'productId', label: 'Product', type: 'select', source: 'products' },
    { key: 'noMovementDays', label: 'No movement for (days)', type: 'number' },
    { key: 'minimumOnHand', label: 'Minimum on-hand quantity', type: 'number' },
  ],
  'sales-by-product': [
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    { key: 'fromDate', label: 'From date', type: 'date' },
    { key: 'toDate', label: 'To date', type: 'date' },
    { key: 'brandId', label: 'Brand', type: 'select', source: 'brands' },
    { key: 'productId', label: 'Product', type: 'select', source: 'products' },
    { key: 'customerId', label: 'Customer', type: 'select', source: 'customers' },
    { key: 'status', label: 'Status', type: 'select', source: 'statuses' },
    {
      key: 'groupBy',
      label: 'Group by',
      type: 'select',
      options: [
        { id: 'product', label: 'Product' },
        { id: 'brand', label: 'Brand' },
      ],
    },
  ],
  'customer-sales-returns': [
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    { key: 'fromDate', label: 'From date', type: 'date' },
    { key: 'toDate', label: 'To date', type: 'date' },
    { key: 'customerId', label: 'Customer', type: 'select', source: 'customers' },
    { key: 'productId', label: 'Product', type: 'select', source: 'products' },
    { key: 'brandId', label: 'Brand', type: 'select', source: 'brands' },
    {
      key: 'transactionType',
      label: 'Transaction type',
      type: 'select',
      options: [
        { id: '', label: 'Sales and returns' },
        { id: 'sales', label: 'Sales' },
        { id: 'return', label: 'Returns' },
      ],
    },
    { key: 'status', label: 'Status', type: 'select', source: 'statuses' },
  ],
  'discount-impact': [
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    { key: 'fromDate', label: 'From date', type: 'date' },
    { key: 'toDate', label: 'To date', type: 'date' },
    { key: 'brandId', label: 'Brand', type: 'select', source: 'brands' },
    { key: 'productId', label: 'Product', type: 'select', source: 'products' },
    { key: 'customerId', label: 'Customer', type: 'select', source: 'customers' },
    {
      key: 'discountType',
      label: 'Discount type',
      type: 'select',
      options: [
        { id: '', label: 'All discount types' },
        { id: 'percentage', label: 'Percentage' },
        { id: 'amount', label: 'Amount' },
      ],
    },
    { key: 'status', label: 'Status', type: 'select', source: 'statuses' },
  ],
  'vendor-purchase-summary': [
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    { key: 'fromDate', label: 'From date', type: 'date' },
    { key: 'toDate', label: 'To date', type: 'date' },
    { key: 'vendorId', label: 'Vendor', type: 'select', source: 'vendors' },
    { key: 'productId', label: 'Product', type: 'select', source: 'products' },
    { key: 'brandId', label: 'Brand', type: 'select', source: 'brands' },
    { key: 'status', label: 'Status', type: 'select', source: 'statuses' },
  ],
  'transfer-performance': [
    { key: 'fromBranchId', label: 'From branch', type: 'select', source: 'branches' },
    { key: 'toBranchId', label: 'To branch', type: 'select', source: 'branches' },
    { key: 'status', label: 'Status', type: 'select', source: 'statuses' },
    { key: 'fromDate', label: 'Requested from', type: 'date' },
    { key: 'toDate', label: 'Requested to', type: 'date' },
    { key: 'expectedFrom', label: 'Expected from', type: 'date' },
    { key: 'expectedTo', label: 'Expected to', type: 'date' },
    { key: 'userId', label: 'Requester', type: 'select', source: 'users' },
  ],
  'transfer-fill-rate': [
    { key: 'fromBranchId', label: 'From branch', type: 'select', source: 'branches' },
    { key: 'toBranchId', label: 'To branch', type: 'select', source: 'branches' },
    { key: 'status', label: 'Status', type: 'select', source: 'statuses' },
    { key: 'fromDate', label: 'Requested from', type: 'date' },
    { key: 'toDate', label: 'Requested to', type: 'date' },
    { key: 'productId', label: 'Product', type: 'select', source: 'products' },
    { key: 'brandId', label: 'Brand', type: 'select', source: 'brands' },
  ],
  'workflow-aging': [
    { key: 'fromDate', label: 'Requested from', type: 'date' },
    { key: 'toDate', label: 'Requested to', type: 'date' },
    { key: 'requestType', label: 'Request type', type: 'select', source: 'requestTypes' },
    { key: 'status', label: 'Status', type: 'select', source: 'statuses' },
    { key: 'branchId', label: 'Source branch', type: 'select', source: 'branches' },
    { key: 'toBranchId', label: 'Destination branch', type: 'select', source: 'branches' },
    { key: 'assignedTo', label: 'Assigned user', type: 'select', source: 'users' },
    { key: 'requestedBy', label: 'Requested by', type: 'select', source: 'users' },
    { key: 'approvedBy', label: 'Approver', type: 'select', source: 'users' },
    { key: 'ageThreshold', label: 'Age threshold (days)', type: 'number' },
    {
      key: 'includeCompleted',
      label: 'Include completed',
      type: 'select',
      options: [
        { id: 'true', label: 'Yes' },
        { id: 'false', label: 'No' },
      ],
    },
  ],
  'branch-comparison': [
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    { key: 'fromDate', label: 'From date', type: 'date' },
    { key: 'toDate', label: 'To date', type: 'date' },
    { key: 'brandId', label: 'Brand', type: 'select', source: 'brands' },
    { key: 'productId', label: 'Product', type: 'select', source: 'products' },
    { key: 'status', label: 'Status', type: 'select', source: 'statuses' },
  ],
  'approver-throughput': [
    { key: 'fromDate', label: 'From date', type: 'date' },
    { key: 'toDate', label: 'To date', type: 'date' },
    {
      key: 'periodBasis',
      label: 'Period basis',
      type: 'select',
      options: [
        { id: 'requested', label: 'Requests received' },
        { id: 'approved', label: 'Actions completed' },
      ],
    },
    { key: 'branchId', label: 'Branch', type: 'select', source: 'branches' },
    { key: 'requestType', label: 'Request type', type: 'select', source: 'requestTypes' },
    { key: 'status', label: 'Status', type: 'select', source: 'statuses' },
    { key: 'assignedTo', label: 'Assigned user', type: 'select', source: 'users' },
    { key: 'approvedBy', label: 'Approver', type: 'select', source: 'users' },
    { key: 'manager', label: 'Manager / team', type: 'select', source: 'users' },
  ],
};

@Directive()
abstract class ImsParameterWindowBase
  extends ReportParameterWindowComponent<Record<string, unknown>>
  implements OnChanges
{
  branches: SessionBranch[];
  values: ParameterValues;

  protected constructor(
    protected auth: AuthService,
    private branchService: BranchService,
    defaults: Record<string, unknown> = {},
  ) {
    super();
    this.branches = auth.currentSession()?.branches || [];
    if (this.branches.some((branch: { branchid: string }) => branch.branchid === '0')) {
      void branchService.getBranches().then((branches) => {
        this.branches = branches;
      });
    }
    const currentBranchId = auth.currentBranchId();
    this.values = {
      branchId: currentBranchId === '0' ? '' : currentBranchId,
      fromDate: '',
      toDate: '',
      ...defaults,
    } as ParameterValues;
  }

  ngOnChanges(): void {
    this.values = { ...this.values, ...this.initialValues } as ParameterValues;
  }
  dateValue(value: unknown): Date | null {
    return stableDate(value);
  }
  dateChanged(key: 'fromDate' | 'toDate', value: Date | null): void {
    this.values[key] = value
      ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
      : '';
    this.apply();
  }
  abstract apply(): void;
  protected publish(extra: Record<string, unknown> = {}): void {
    const branchId = String(this.values.branchId || '');
    const branchLabel =
      this.branches.find(
        (branch: { branchid: string; name: string }) => branch.branchid === branchId,
      )?.name || (branchId ? 'Branch unavailable' : 'All accessible branches');
    this.publishFilters({ ...this.values, branchLabel, ...extra });
  }
}

@Component({
  selector: 'app-cashflow-report-parameters',
  standalone: true,
  imports,
  template: ` <div class="report-parameters">
    <mat-form-field appearance="outline"
      ><mat-label>Branch</mat-label
      ><mat-select [(ngModel)]="values.branchId" (selectionChange)="apply()"
        ><mat-option value="">All accessible branches</mat-option
        ><mat-option *ngFor="let branch of branches" [value]="branch.branchid">{{
          branch.name
        }}</mat-option></mat-select
      ></mat-form-field
    >
    <mat-form-field appearance="outline"
      ><mat-label>From date</mat-label
      ><input
        matInput
        [matDatepicker]="fromPicker"
        [ngModel]="dateValue(values.fromDate)"
        (dateChange)="dateChanged('fromDate', $event.value)" /><mat-datepicker-toggle
        matSuffix
        [for]="fromPicker"
      ></mat-datepicker-toggle
      ><mat-datepicker #fromPicker></mat-datepicker
    ></mat-form-field>
    <mat-form-field appearance="outline"
      ><mat-label>To date</mat-label
      ><input
        matInput
        [matDatepicker]="toPicker"
        [ngModel]="dateValue(values.toDate)"
        (dateChange)="dateChanged('toDate', $event.value)" /><mat-datepicker-toggle
        matSuffix
        [for]="toPicker"
      ></mat-datepicker-toggle
      ><mat-datepicker #toPicker></mat-datepicker
    ></mat-form-field>
    <mat-form-field appearance="outline"
      ><mat-label>Movement type</mat-label
      ><mat-select [(ngModel)]="values.movementType" (selectionChange)="apply()"
        ><mat-option value="">All movement types</mat-option
        ><mat-option *ngFor="let type of movementTypes" [value]="type">{{
          type
        }}</mat-option></mat-select
      ></mat-form-field
    >
    <mat-form-field appearance="outline"
      ><mat-label>Customer / vendor</mat-label
      ><mat-select [(ngModel)]="values.party" (selectionChange)="apply()"
        ><mat-option value="">All counterparties</mat-option
        ><mat-option *ngFor="let item of counterparties" [value]="item.name"
          >{{ item.kind }} · {{ item.name }}</mat-option
        ></mat-select
      ></mat-form-field
    >
    <button mat-stroked-button type="button" (click)="apply()">
      <mat-icon>filter_alt</mat-icon> Apply filters
    </button>
  </div>`,
  styles: [windowStyles],
})
export class CashFlowReportParametersComponent extends ImsParameterWindowBase implements OnInit {
  readonly movementTypes = [
    'Receipt',
    'Payment',
    'Other income',
    'Expense',
    'Owner contribution',
    'Owner withdrawal',
  ];
  counterparties: { name: string; kind: string }[] = [];
  constructor(
    auth: AuthService,
    branchService: BranchService,
    private customerService: CustomerService,
    private vendorService: VendorService,
    private toast: ToastService,
  ) {
    super(auth, branchService, { movementType: '', party: '' });
  }
  async ngOnInit(): Promise<void> {
    try {
      const [customers, vendors] = await Promise.all([
        this.customerService.getCustomers(),
        this.vendorService.getVendors(),
      ]);
      this.counterparties = [
        ...customers.map((item) => ({ name: item.name, kind: 'Customer' })),
        ...vendors.map((item) => ({ name: item.name, kind: 'Vendor' })),
      ];
    } catch {
      this.toast.error('Customer and vendor filters could not be loaded.');
    }
    this.apply();
  }
  apply(): void {
    const kind = this.counterparties.find((item) => item.name === this.values.party)?.kind;
    this.publish({
      partyLabel: this.values.party ? `${kind || 'Counterparty'} · ${this.values.party}` : '',
    });
  }
}

@Component({
  selector: 'app-analytics-report-parameters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDatepickerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: ` <div class="report-parameters">
    <ng-container *ngFor="let field of fields">
      <mat-form-field appearance="outline" *ngIf="field.type === 'select'"
        ><mat-label>{{ field.label }}</mat-label
        ><mat-select [(ngModel)]="values[field.key]" (selectionChange)="apply()"
          ><mat-option *ngFor="let option of optionsFor(field)" [value]="option.id">{{
            option.label
          }}</mat-option></mat-select
        ></mat-form-field
      >
      <mat-form-field appearance="outline" *ngIf="field.type === 'date'"
        ><mat-label>{{ field.label }}</mat-label
        ><input
          matInput
          [matDatepicker]="picker"
          [ngModel]="dateValue(values[field.key])"
          (dateChange)="dateChanged(field.key, $event.value)" /><mat-datepicker-toggle
          matSuffix
          [for]="picker"
        ></mat-datepicker-toggle
        ><mat-datepicker #picker></mat-datepicker
      ></mat-form-field>
      <mat-form-field appearance="outline" *ngIf="field.type === 'number'"
        ><mat-label>{{ field.label }}</mat-label
        ><input matInput type="number" min="0" [(ngModel)]="values[field.key]" (change)="apply()"
      /></mat-form-field>
      <mat-form-field appearance="outline" *ngIf="field.type === 'text'"
        ><mat-label>{{ field.label }}</mat-label
        ><input matInput [(ngModel)]="values[field.key]" (change)="apply()"
      /></mat-form-field>
    </ng-container>
    <button mat-stroked-button type="button" (click)="apply()">
      <mat-icon>filter_alt</mat-icon> Apply filters
    </button>
  </div>`,
  styles: [windowStyles],
})
export class AnalyticsReportParametersComponent
  extends ReportParameterWindowComponent<Record<string, unknown>>
  implements OnInit, OnChanges
{
  fields: AnalyticsFilter[] = [];
  values: Record<string, unknown> = {};
  branches: { id: string; label: string }[] = [];
  products: { id: string; label: string }[] = [];
  brands: { id: string; label: string }[] = [];
  customers: { id: string; label: string }[] = [];
  vendors: { id: string; label: string }[] = [];
  users: { id: string; label: string }[] = [];
  private configuredReport = '';
  private optionVersion = 0;
  private optionLists = new Map<
    string,
    { version: number; options: { id: string; label: string }[] }
  >();

  constructor(
    private auth: AuthService,
    private branchService: BranchService,
    private productService: ProductService,
    private brandService: BrandService,
    private customerService: CustomerService,
    private vendorService: VendorService,
    private userService: UsersService,
    private toast: ToastService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.configure();
    void this.loadChoices();
  }
  ngOnChanges(): void {
    const previousReport = this.configuredReport;
    const reportId = String(this.initialValues['reportId'] || '');
    if (previousReport && reportId && reportId !== previousReport) this.optionVersion++;
    this.configure();
    if (previousReport && previousReport !== this.configuredReport) void this.loadChoices();
  }

  private configure(): void {
    const reportId = String(this.initialValues['reportId'] || '');
    if (!reportId) return;
    this.fields = analyticsFilters[reportId] || [];
    this.values = { ...this.values, ...this.initialValues };
    if (reportId !== this.configuredReport) {
      this.configuredReport = reportId;
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      if (this.fields.some((item) => item.key === 'fromDate') && !this.values['fromDate'])
        this.values['fromDate'] = this.formatDate(start);
      if (this.fields.some((item) => item.key === 'toDate') && !this.values['toDate'])
        this.values['toDate'] = this.formatDate(now);
      if (this.fields.some((item) => item.key === 'threshold') && !this.values['threshold'])
        this.values['threshold'] = 2;
      if (
        this.fields.some((item) => item.key === 'noMovementDays') &&
        !this.values['noMovementDays']
      )
        this.values['noMovementDays'] = 90;
      if (this.fields.some((item) => item.key === 'ageThreshold') && !this.values['ageThreshold'])
        this.values['ageThreshold'] = 7;
      if (
        this.fields.some((item) => item.key === 'includeCompleted') &&
        !this.values['includeCompleted']
      )
        this.values['includeCompleted'] = 'false';
      if (this.fields.some((item) => item.key === 'basis') && !this.values['basis'])
        this.values['basis'] = 'on-hand';
      if (this.fields.some((item) => item.key === 'groupBy') && !this.values['groupBy'])
        this.values['groupBy'] = 'product';
      if (this.fields.some((item) => item.key === 'periodBasis') && !this.values['periodBasis'])
        this.values['periodBasis'] = 'requested';
      if (
        [
          'sales-summary',
          'sales-by-product',
          'customer-sales-returns',
          'discount-impact',
          'vendor-purchase-summary',
        ].includes(reportId) &&
        !this.values['status']
      )
        this.values['status'] = 'Approved';
    }
  }

  private async loadChoices(): Promise<void> {
    const accessible = this.auth.currentSession()?.branches || [];
    const sources = new Set(this.fields.map((field) => field.source).filter(Boolean));
    const needs = (source: string) => sources.has(source);
    try {
      const settled = await Promise.allSettled([
        needs('branches') && accessible.some((branch) => branch.branchid === '0')
          ? this.branchService.getBranches()
          : Promise.resolve([]),
        needs('products') ? this.productService.getProducts() : Promise.resolve([]),
        needs('brands') ? this.brandService.getBrands() : Promise.resolve([]),
        needs('customers') ? this.customerService.getCustomers() : Promise.resolve([]),
        needs('vendors') ? this.vendorService.getVendors() : Promise.resolve([]),
        needs('users') ? this.userService.getUsers() : Promise.resolve([]),
      ]);
      if (settled.some((item) => item.status === 'rejected'))
        this.toast.error('Some report filter options could not be loaded.');
      const get = <T>(index: number): T =>
        settled[index].status === 'fulfilled' ? (settled[index].value as T) : ([] as T);
      const [allBranches, products, brands, customers, vendors, users] = [
        get<SessionBranch[]>(0),
        get<Product[]>(1),
        get<Brand[]>(2),
        get<Customer[]>(3),
        get<Vendor[]>(4),
        get<User[]>(5),
      ];
      this.branches = (
        allBranches.length
          ? allBranches.map((item) => ({ id: item.branchid, label: item.name }))
          : accessible.map((item) => ({ id: item.branchid, label: item.name }))
      ).filter((item) => item.id !== '0');
      this.products = products.map((item) => ({
        id: item.id || '',
        label: `${item.name}${item.brand ? ` · ${item.brand}` : ''}`,
      }));
      this.brands = brands.map((item) => ({ id: item.id || '', label: item.name }));
      this.customers = customers.map((item) => ({
        id: item.id || '',
        label: item.phone ? `${item.name} · ${item.phone}` : item.name,
      }));
      this.vendors = vendors.map((item) => ({ id: item.id || '', label: item.name }));
      this.users = users.map((item) => ({ id: item.userid || '', label: item.name }));
      this.optionVersion++;
      this.configure();
      this.apply();
    } catch {
      this.toast.error('Report filter options could not be loaded.');
      this.publishFilters(this.values);
    }
  }

  optionsFor(field: AnalyticsFilter): { id: string; label: string }[] {
    const cached = this.optionLists.get(field.key);
    if (cached?.version === this.optionVersion) return cached.options;
    const options = this.createOptions(field);
    this.optionLists.set(field.key, { version: this.optionVersion, options });
    return options;
  }

  private createOptions(field: AnalyticsFilter): { id: string; label: string }[] {
    const sources: Record<string, { id: string; label: string }[]> = {
      branches: this.branches,
      products: this.products,
      brands: this.brands,
      customers: this.customers,
      vendors: this.vendors,
      users: this.users,
      statuses: [
        'Pending',
        'Approved',
        'Rejected',
        'In Process',
        'Dispatched',
        'In Transit',
        'Arrived at Station',
        'Received',
        'Completed',
      ].map((id) => ({ id, label: id })),
      requestTypes: ['StockIn', 'StockOut', 'Sales', 'SalesReturn', 'Transfer'].map((id) => ({
        id,
        label: id.replace(/([a-z])([A-Z])/g, '$1 $2'),
      })),
    };
    const choices = field.options || sources[field.source || ''] || [];
    const sessionBranches = this.auth.currentSession()?.branches || [];
    const canSelectAllBranches =
      field.source !== 'branches' ||
      sessionBranches.some((item) => item.branchid === '0') ||
      this.branches.length > 1;
    const allLabel =
      field.source === 'branches' ? 'All permitted branches' : `All ${field.label.toLowerCase()}`;
    return [
      ...(canSelectAllBranches ? [{ id: '', label: allLabel }] : []),
      ...choices.filter((item) => item.id !== ''),
    ];
  }

  dateValue(value: unknown): Date | null {
    return stableDate(value);
  }
  dateChanged(key: string, value: Date | null): void {
    this.values[key] = value ? this.formatDate(value) : '';
    this.apply();
  }
  private formatDate(value: Date): string {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }

  apply(): void {
    const labels: Record<string, string> = {};
    const active: string[] = [];
    for (const field of this.fields) {
      const value = String(this.values[field.key] || '');
      const choice = this.optionsFor(field).find((option) => option.id === value);
      if (choice && value) {
        labels[`${field.key}Label`] = choice.label;
        active.push(`${field.label}: ${choice.label}`);
      } else if ((field.type === 'number' || field.type === 'text') && value)
        active.push(`${field.label}: ${value}`);
      else if (field.type === 'date' && value)
        active.push(`${field.label}: ${this.dateValue(value)?.toLocaleDateString() || value}`);
    }
    labels['branchLabel'] = labels['branchIdLabel'] || 'All permitted branches';
    labels['appliedFilters'] = active.join(' · ');
    this.publishFilters({ ...this.values, ...labels });
  }
}
