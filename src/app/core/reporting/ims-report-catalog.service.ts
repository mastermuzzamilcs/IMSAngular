import { Injectable } from '@angular/core';
import {
  collection, count, DocumentData, getAggregateFromServer, getCountFromServer, getDocs, limit,
  orderBy, query, QueryConstraint, QueryDocumentSnapshot, startAfter, sum, Timestamp, where,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { AuthService } from '../services/auth.service';
import { BranchService } from '../services/branchservice.service';
import { CustomerService } from '../services/customer.service';
import { VendorService } from '../services/vendor.service';
import { ReportAggregate, ReportColumn, ReportDefinition, ReportFilters, ReportPageRequest, ReportParameterWindowId, ReportValue } from '@mesix/reporting';
import { ImsAdvancedReportCatalogService } from './ims-advanced-report-catalog.service';
import { AppSettingsService } from '../services/app-settings.service';

type ReportRow = Record<string, ReportValue>;
const CASH_IN_TYPES = ['Receipt', 'Other income', 'Owner contribution'];
const CASH_OUT_TYPES = ['Payment', 'Expense', 'Owner withdrawal'];
const DATE_COLUMNS: ReportColumn[] = [
  { key: 'date', label: 'Date', format: 'date' }, { key: 'branchName', label: 'Branch' },
  { key: 'transactionKind', label: 'Transaction type' }, { key: 'party', label: 'Customer' }, { key: 'reference', label: 'Transaction reference' },
  { key: 'quantity', label: 'Units', format: 'number' }, { key: 'amount', label: 'Transaction amount', format: 'currency' },
];
const PURCHASE_COLUMNS: ReportColumn[] = DATE_COLUMNS.map((column) => column.key === 'party' ? { ...column, label: 'Customer / vendor' } : column);
const STOCK_COLUMNS: ReportColumn[] = [
  { key: 'branchName', label: 'Branch' }, { key: 'productName', label: 'Product' }, { key: 'brandName', label: 'Brand' },
  { key: 'quantity', label: 'On hand', format: 'number' }, { key: 'reserved', label: 'Reserved', format: 'number' },
  { key: 'available', label: 'Available', format: 'number' }, { key: 'price', label: 'Selling price', format: 'currency' },
  { key: 'retailValue', label: 'Estimated retail value', format: 'currency' },
];
const CASH_COLUMNS: ReportColumn[] = [
  { key: 'date', label: 'Date', format: 'date' }, { key: 'branchName', label: 'Branch' },
  { key: 'type', label: 'Movement' }, { key: 'category', label: 'Category' },
  { key: 'party', label: 'Customer / vendor' }, { key: 'reference', label: 'Transaction reference' },
  { key: 'inflow', label: 'Cash in', format: 'currency' }, { key: 'outflow', label: 'Cash out', format: 'currency' },
];

@Injectable({ providedIn: 'root' })
export class ImsReportCatalogService {
  private readonly pageCursors = new Map<string, Map<number, QueryDocumentSnapshot<DocumentData>>>();
  private customersById?: Promise<Map<string, string>>;
  private vendorsById?: Promise<Map<string, string>>;
  private allBranchNames?: Promise<void>;
  private readonly branchNames = new Map<string, string>();

  constructor(private auth: AuthService, private branchService: BranchService, private customerService: CustomerService, private vendorService: VendorService, private advanced: ImsAdvancedReportCatalogService, private settings: AppSettingsService) {
    for (const branch of auth.currentSession()?.branches || []) this.branchNames.set(branch.branchid, branch.name);
  }

  get definitions(): ReportDefinition<ReportRow>[] {
    return [...this.advanced.definitions, this.cashFlowReport()];
  }

  private stockReport(): ReportDefinition<ReportRow> {
    return {
      id: 'inventory-on-hand', title: 'Inventory on hand', description: 'Current branch-level laptop inventory, reservations, availability and estimated selling value. Selling value is not accounting cost.',
      columns: STOCK_COLUMNS, parameterWindowId: ReportParameterWindowId.Inventory,
      header: (filters) => this.headerFields(filters, [['productLabel', 'Product'], ['brandLabel', 'Brand']]),
      loadPage: (request) => this.pageOverview(request), loadAll: (filters, progress) => this.allPages((pageIndex) => this.pageOverview({ filters, pageIndex, pageSize: 500 }, false), progress),
      loadAggregates: (filters) => this.stockAggregates(filters),
    };
  }

  private transactionReport(id: 'sales' | 'purchases', title: string, description: string, stocktype: 'in' | 'out'): ReportDefinition<ReportRow> {
    return {
      id, title, description, columns: stocktype === 'out' ? DATE_COLUMNS : PURCHASE_COLUMNS,
      parameterWindowId: stocktype === 'out' ? ReportParameterWindowId.Sales : ReportParameterWindowId.Purchase,
      header: (activeFilters) => this.headerFields(activeFilters, [[stocktype === 'out' ? 'customerName' : 'vendorName', stocktype === 'out' ? 'Customer' : 'Vendor']]),
      loadPage: (request) => this.pageTransactions(request, stocktype),
      loadAll: (activeFilters, progress) => this.allPages((pageIndex) => this.pageTransactions({ filters: activeFilters, pageIndex, pageSize: 500 }, stocktype, false), progress),
      loadAggregates: (activeFilters) => this.transactionAggregates(activeFilters, stocktype),
    };
  }

  private cashFlowReport(): ReportDefinition<ReportRow> {
    return {
      id: 'cash-flow', title: 'Cash flow ledger', description: 'Recorded receipts, payments, operating expenses and owner movements. Only movements entered in the cash ledger are included.',
      columns: CASH_COLUMNS, parameterWindowId: ReportParameterWindowId.CashFlow,
      header: (filters) => this.headerFields(filters, [['movementType', 'Movement type'], ['partyLabel', 'Customer / vendor']]),
      loadPage: (request) => this.pageCashFlow(request),
      loadAll: (filters, progress) => this.allPages((pageIndex) => this.pageCashFlow({ filters, pageIndex, pageSize: 500 }, false), progress),
      loadAggregates: (filters) => this.cashAggregates(filters),
    };
  }

  private async pageTransactions(request: ReportPageRequest, stocktype: 'in' | 'out', includeCount = true) {
    const constraints = this.stockConstraints(request.filters, stocktype);
    const ref = collection(firestore, 'inventory_stocks');
    const total = includeCount ? (await getCountFromServer(query(ref, ...constraints))).data().count : Number.MAX_SAFE_INTEGER;
    const cursorKey = `${stocktype}:${this.filterKey(request.filters)}:${request.pageSize}`;
    const docs = await this.readPage(query(ref, ...constraints, orderBy('entrydate', 'desc')), request.pageIndex, request.pageSize, cursorKey);
    await Promise.all([this.ensurePartyNames('out'), this.ensurePartyNames('in'), this.ensureAllBranchNames()]);
    const rows = docs.map((snapshot) => this.mapTransaction(snapshot.data() as DocumentData, stocktype));
    return { rows, total };
  }

  private stockConstraints(filters: ReportFilters, stocktype?: 'in' | 'out'): QueryConstraint[] {
    const constraints: QueryConstraint[] = [where('status', '==', 'Approved')];
    if (stocktype) constraints.push(where('stocktype', '==', stocktype));
    this.addBranchConstraints(constraints, filters, 'branchid');
    if (filters.fromDate) constraints.push(where('entrydate', '>=', Timestamp.fromDate(this.dayStart(filters.fromDate))));
    if (filters.toDate) constraints.push(where('entrydate', '<=', Timestamp.fromDate(this.dayEnd(filters.toDate))));
    const customerId = String(filters.customValues?.['customerId'] || '');
    const vendorId = String(filters.customValues?.['vendorId'] || '');
    if (stocktype === 'out' && customerId) constraints.push(where('customerid', '==', customerId));
    if (stocktype === 'in' && vendorId) constraints.push(where('vendorid', '==', vendorId));
    return constraints;
  }

  private async pageOverview(request: ReportPageRequest, includeCount = true) {
    const constraints: QueryConstraint[] = [];
    this.addBranchConstraints(constraints, request.filters, 'branchid');
    const productId = String(request.filters.customValues?.['productId'] || '');
    const brandId = String(request.filters.customValues?.['brandId'] || '');
    if (productId) constraints.push(where('productid', '==', productId));
    if (brandId) constraints.push(where('brandid', '==', brandId));
    const ref = collection(firestore, 'inventory_stock_overview');
    const total = includeCount ? (await getCountFromServer(query(ref, ...constraints))).data().count : Number.MAX_SAFE_INTEGER;
    const cursorKey = `inventory:${this.filterKey(request.filters)}:${request.pageSize}`;
    const docs = await this.readPage(query(ref, ...constraints, orderBy('branchid'), orderBy('productName')), request.pageIndex, request.pageSize, cursorKey);
    const rows = docs.map((snapshot) => {
      const data = snapshot.data() as DocumentData;
      const quantity = Number(data['balanceQuantity'] ?? data['quantity'] ?? 0);
      const reserved = Number(data['reservedQuantity'] || 0);
      const price = Number(data['price'] || 0);
      return {
        branchName: String(data['branchName'] || this.branchNames.get(String(data['branchid'] || '')) || 'Branch unavailable'),
        productName: String(data['productName'] || 'Product unavailable'), brandName: String(data['brandName'] || 'Brand unavailable'),
        quantity, reserved, available: quantity - reserved, price, retailValue: quantity * price,
      };
    });
    return { rows, total };
  }

  private async pageCashFlow(request: ReportPageRequest, includeCount = true) {
    const constraints = this.cashConstraints(request.filters);
    const ref = collection(firestore, 'financial_cash_transactions');
    const total = includeCount ? (await getCountFromServer(query(ref, ...constraints))).data().count : Number.MAX_SAFE_INTEGER;
    const cursorKey = `cash:${this.filterKey(request.filters)}:${request.pageSize}`;
    const docs = await this.readPage(query(ref, ...constraints, orderBy('transactionDate', 'desc')), request.pageIndex, request.pageSize, cursorKey);
    await this.ensureAllBranchNames();
    const inflowTypes = new Set(CASH_IN_TYPES);
    const rows = docs.map((snapshot) => {
      const data = snapshot.data() as DocumentData;
      const amount = Number(data['amount'] || 0); const type = String(data['type'] || '');
      return {
        date: this.toDate(data['transactionDate']),
        branchName: String(data['branchName'] || this.branchNames.get(String(data['branchId'] || '')) || 'Branch unavailable'),
        type: type || 'Unclassified movement', category: String(data['category'] || 'Uncategorized'),
        party: String(data['party'] || 'Not recorded'), reference: this.displayReference(data),
        inflow: inflowTypes.has(type) ? amount : 0, outflow: inflowTypes.has(type) ? 0 : amount,
      };
    });
    return { rows, total };
  }

  private mapTransaction(data: DocumentData, stocktype: 'in' | 'out'): ReportRow {
    const isSale = stocktype === 'out';
    const branchId = String(data['branchid'] || '');
    const isCustomerMovement = isSale || Boolean(data['customerid']);
    const partyId = String(data[isCustomerMovement ? 'customerid' : 'vendorid'] || '');
    const storedPartyName = String(data[isCustomerMovement ? 'customerName' : 'vendorName'] || '');
    const names = isCustomerMovement ? this.customerNames : this.vendorNames;
    const date = this.toDate(data['entrydate']);
    return {
      date, branchName: String(data['branchName'] || this.branchNames.get(branchId) || 'Branch unavailable'),
      transactionKind: isSale ? (isCustomerMovement ? 'Sale' : 'Stock out') : (isCustomerMovement ? 'Sales return' : (data['vendorid'] ? 'Purchase' : 'Stock in')),
      party: storedPartyName || names?.get(partyId) || (partyId ? (isCustomerMovement ? 'Customer unavailable' : 'Vendor unavailable') : 'Not recorded'),
      reference: this.displayReference(data), quantity: Number(data['quantity'] || 0), amount: Number(data['NetTotal'] || 0),
    };
  }

  private async stockAggregates(filters: ReportFilters): Promise<ReportAggregate[]> {
    const constraints: QueryConstraint[] = [];
    this.addBranchConstraints(constraints, filters, 'branchid');
    const productId = String(filters.customValues?.['productId'] || '');
    const brandId = String(filters.customValues?.['brandId'] || '');
    if (productId) constraints.push(where('productid', '==', productId));
    if (brandId) constraints.push(where('brandid', '==', brandId));
    const summary = await getAggregateFromServer(query(collection(firestore, 'inventory_stock_overview'), ...constraints), {
      products: count(), units: sum('balanceQuantity'), reserved: sum('reservedQuantity'),
    });
    const values = summary.data();
    const units = Number(values['units'] || 0); const reserved = Number(values['reserved'] || 0);
    return [
      { key: 'products', label: 'Product / branch rows', value: Number(values['products'] || 0), format: 'number' },
      { key: 'units', label: 'Units on hand', value: units, format: 'number' },
      { key: 'reserved', label: 'Units reserved', value: reserved, format: 'number' },
      { key: 'available', label: 'Units available', value: units - reserved, format: 'number' },
    ];
  }

  private async transactionAggregates(filters: ReportFilters, stocktype: 'in' | 'out'): Promise<ReportAggregate[]> {
    const result = await getAggregateFromServer(query(collection(firestore, 'inventory_stocks'), ...this.stockConstraints(filters, stocktype)), {
      transactions: count(), units: sum('quantity'), amount: sum('NetTotal'),
    });
    const values = result.data();
    return [
      { key: 'transactions', label: 'Transactions', value: Number(values['transactions'] || 0), format: 'number' },
      { key: 'units', label: stocktype === 'out' ? 'Outbound units' : 'Inbound units', value: Number(values['units'] || 0), format: 'number' },
      { key: 'amount', label: stocktype === 'out' ? 'Outbound transaction amount' : 'Inbound transaction amount', value: Number(values['amount'] || 0), format: 'currency', detail: 'Gross transaction total; not net profit.' },
    ];
  }

  private async cashAggregates(filters: ReportFilters): Promise<ReportAggregate[]> {
    const base = this.cashConstraints(filters);
    const ref = collection(firestore, 'financial_cash_transactions');
    const requestedType = String(filters.customValues?.['movementType'] || '');
    if (requestedType) {
      const result = await getAggregateFromServer(query(ref, ...base), { movements: count(), amount: sum('amount') });
      const value = Number(result.data()['amount'] || 0);
      const isIn = CASH_IN_TYPES.includes(requestedType);
      return [
        { key: 'movements', label: 'Movements', value: Number(result.data()['movements'] || 0), format: 'number' },
        { key: isIn ? 'inflow' : 'outflow', label: isIn ? 'Cash in' : 'Cash out', value, format: 'currency' },
      ];
    }
    const typeSummaries = await Promise.all([...CASH_IN_TYPES, ...CASH_OUT_TYPES].map((type) =>
      getAggregateFromServer(query(ref, ...base, where('type', '==', type)), { movements: count(), amount: sum('amount') }),
    ));
    const cashIn = typeSummaries.slice(0, CASH_IN_TYPES.length).reduce((total, item) => total + Number(item.data()['amount'] || 0), 0);
    const cashOut = typeSummaries.slice(CASH_IN_TYPES.length).reduce((total, item) => total + Number(item.data()['amount'] || 0), 0);
    return [
      { key: 'cashIn', label: 'Cash received', value: cashIn, format: 'currency' },
      { key: 'cashOut', label: 'Cash paid', value: cashOut, format: 'currency' },
      { key: 'netCash', label: 'Net cash movement', value: cashIn - cashOut, format: 'currency' },
      { key: 'movements', label: 'Movements', value: typeSummaries.reduce((total, item) => total + Number(item.data()['movements'] || 0), 0), format: 'number' },
    ];
  }

  private cashConstraints(filters: ReportFilters): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];
    this.addBranchConstraints(constraints, filters, 'branchId');
    if (filters.fromDate) constraints.push(where('transactionDate', '>=', Timestamp.fromDate(this.dayStart(filters.fromDate))));
    if (filters.toDate) constraints.push(where('transactionDate', '<=', Timestamp.fromDate(this.dayEnd(filters.toDate))));
    const movementType = String(filters.customValues?.['movementType'] || '');
    if (movementType) constraints.push(where('type', '==', movementType));
    const party = String(filters.customValues?.['party'] || '');
    if (party) constraints.push(where('party', '==', party));
    return constraints;
  }

  private addBranchConstraints(constraints: QueryConstraint[], filters: ReportFilters, field: 'branchid' | 'branchId'): void {
    const allowed = this.auth.currentSession()?.branches || [];
    const canSeeAll = allowed.some((branch) => branch.branchid === '0');
    const allowedIds = allowed.map((branch) => branch.branchid).filter((id) => id !== '0');
    const requested = filters.branchId;
    if (requested && requested !== '0') {
      constraints.push(where(field, '==', canSeeAll || allowedIds.includes(requested) ? requested : '__unauthorized_branch__'));
    } else if (!canSeeAll && allowedIds.length === 1) constraints.push(where(field, '==', allowedIds[0]));
    else if (!canSeeAll && allowedIds.length > 1) constraints.push(where(field, 'in', allowedIds.slice(0, 30)));
    else if (!canSeeAll) constraints.push(where(field, '==', '__unauthorized_branch__'));
  }

  private async readPage(ref: ReturnType<typeof query>, pageIndex: number, pageSize: number, cacheKey: string): Promise<QueryDocumentSnapshot<DocumentData>[]> {
    let cursors = this.pageCursors.get(cacheKey);
    if (!cursors) {
      if (this.pageCursors.size >= 20) this.pageCursors.delete(this.pageCursors.keys().next().value!);
      cursors = new Map(); this.pageCursors.set(cacheKey, cursors);
    }
    if (pageIndex > 0 && !cursors.has(1)) {
      const first = await getDocs(query(ref, limit(pageSize)));
      if (first.empty) return [];
      cursors.set(1, first.docs[first.docs.length - 1] as QueryDocumentSnapshot<DocumentData>);
    }
    for (let page = 1; page < pageIndex; page++) {
      if (cursors.has(page + 1)) continue;
      const startCursor = cursors.get(page);
      const previous = await getDocs(query(ref, limit(pageSize), ...(startCursor ? [startAfter(startCursor)] : [])));
      if (previous.empty) return [];
      cursors.set(page + 1, previous.docs[previous.docs.length - 1] as QueryDocumentSnapshot<DocumentData>);
    }
    const cursor = pageIndex > 0 ? cursors.get(pageIndex) : undefined;
    const result = await getDocs(query(ref, limit(pageSize), ...(cursor ? [startAfter(cursor)] : [])));
    const last = result.docs[result.docs.length - 1] as QueryDocumentSnapshot<DocumentData> | undefined;
    if (last) cursors.set(pageIndex + 1, last);
    return result.docs as QueryDocumentSnapshot<DocumentData>[];
  }

  private async allPages(load: (index: number) => Promise<{ rows: ReportRow[]; total: number }>, progress?: (count: number) => void): Promise<ReportRow[]> {
    const result: ReportRow[] = []; let pageIndex = 0; let total = Number.MAX_SAFE_INTEGER;
    while (result.length < total) {
      const page = await load(pageIndex++); total = page.total;
      if (!page.rows.length) break;
      result.push(...page.rows); progress?.(result.length);
    }
    return result;
  }

  private async ensurePartyNames(stocktype: 'in' | 'out'): Promise<void> {
    if (stocktype === 'out' && !this.customersById) this.customersById = this.customerService.getCustomers().then((items) => new Map(items.map((item) => [item.id || '', item.name])));
    if (stocktype === 'in' && !this.vendorsById) this.vendorsById = this.vendorService.getVendors().then((items) => new Map(items.map((item) => [item.id || '', item.name])));
    if (stocktype === 'out') this.customerNames = await this.customersById!;
    else this.vendorNames = await this.vendorsById!;
  }
  private customerNames?: Map<string, string>;
  private vendorNames?: Map<string, string>;

  private async ensureAllBranchNames(): Promise<void> {
    if (!this.allBranchNames) {
      this.allBranchNames = this.branchService.getBranches().then((branches) => {
        for (const branch of branches) if (branch.branchid && branch.name) this.branchNames.set(branch.branchid, branch.name);
      });
    }
    await this.allBranchNames;
  }

  private headerFields(filters: ReportFilters, extra: [string, string][]): { label: string; value: ReportValue }[] {
    const custom = filters.customValues || {};
    const branchName = custom['branchLabel'] || (filters.branchId ? this.branchNames.get(filters.branchId) || 'Selected branch' : 'All accessible branches');
    const fields: { label: string; value: ReportValue }[] = [{ label: 'Report', value: 'Cash flow ledger' }, { label: 'Organization / IMS', value: this.settings.title }, { label: 'Branch scope', value: branchName }];
    if (filters.fromDate) fields.push({ label: 'From', value: this.toDate(filters.fromDate)?.toLocaleDateString() || String(filters.fromDate) });
    if (filters.toDate) fields.push({ label: 'To', value: this.toDate(filters.toDate)?.toLocaleDateString() || String(filters.toDate) });
    for (const [key, label] of extra) if (custom[key]) fields.push({ label, value: custom[key] });
    fields.push({ label: 'Generated at', value: new Date().toLocaleString() }, { label: 'Generated by', value: this.auth.currentSession()?.name || 'Current user' }, { label: 'Currency', value: `${this.settings.currencyName} (${this.settings.currencyCode})` }, { label: 'Unit of measure', value: 'Units' });
    const active = String(custom['appliedFilters'] || ''); if (active) fields.push({ label: 'Applied filters', value: active });
    return fields;
  }
  private displayReference(data: DocumentData): string {
    const reference = data['referenceNumber'] || data['transactionNumber'] || data['invoiceNumber'] || data['reference'];
    return String(reference || 'Not recorded');
  }
  private filterKey(filters: ReportFilters): string { return JSON.stringify({ branchId: filters.branchId, fromDate: filters.fromDate, toDate: filters.toDate, customValues: filters.customValues }); }
  private toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Timestamp) return value.toDate();
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  private dayStart(value: Date | string): Date { const date = new Date(value); date.setHours(0, 0, 0, 0); return date; }
  private dayEnd(value: Date | string): Date { const date = new Date(value); date.setHours(23, 59, 59, 999); return date; }
}
