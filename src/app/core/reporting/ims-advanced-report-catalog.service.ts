import { Injectable } from '@angular/core';
import {
  collection,
  documentId,
  DocumentData,
  getDocs,
  query,
  QueryConstraint,
  Timestamp,
  where,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { AuthService } from '../services/auth.service';
import { BranchService } from '../services/branchservice.service';
import { ProductService } from '../services/product.service';
import { BrandService } from '../services/brand.service';
import { CustomerService } from '../services/customer.service';
import { VendorService } from '../services/vendor.service';
import { UsersService } from '../services/users.service';
import { TransferService } from '../services/transfer.service';
import { AppSettingsService } from '../services/app-settings.service';
import {
  ReportAggregate,
  ReportColumn,
  ReportDefinition,
  ReportFilters,
  ReportParameterWindowId,
  ReportValue,
} from '@mesix/reporting';

type Row = Record<string, ReportValue>;
type Raw = DocumentData & { __key: string };
type Loader = (filters: ReportFilters) => Promise<Row[]>;
const money = (key: string, label: string): ReportColumn => ({ key, label, format: 'currency' });
const quantity = (key: string, label: string): ReportColumn => ({ key, label, format: 'number' });
const date = (key: string, label: string): ReportColumn => ({ key, label, format: 'date' });
const text = (key: string, label: string): ReportColumn => ({ key, label });

@Injectable({ providedIn: 'root' })
export class ImsAdvancedReportCatalogService {
  private readonly cache = new Map<string, { expires: number; value: Promise<Row[]> }>();
  private branches?: Promise<Map<string, string>>;
  private products?: Promise<
    Map<string, { name: string; brandId: string; brand: string; price: number }>
  >;
  private brands?: Promise<Map<string, string>>;
  private customers?: Promise<Map<string, string>>;
  private vendors?: Promise<Map<string, string>>;
  private users?: Promise<Map<string, string>>;

  constructor(
    private auth: AuthService,
    private branchService: BranchService,
    private productService: ProductService,
    private brandService: BrandService,
    private customerService: CustomerService,
    private vendorService: VendorService,
    private userService: UsersService,
    private transferService: TransferService,
    private settings: AppSettingsService,
  ) {}

  get definitions(): ReportDefinition<Row>[] {
    return [
      this.definition(
        'inventory-on-hand',
        'Stock on hand',
        'Current branch-level inventory snapshot. Stock value is on-hand units × current selling price and is estimated retail value, not accounting cost.',
        ReportParameterWindowId.Inventory,
        [
          text('branch', 'Branch'),
          text('product', 'Product'),
          text('brand', 'Brand'),
          quantity('onHand', 'On hand'),
          quantity('reserved', 'Reserved'),
          quantity('available', 'Available'),
          money('unitPrice', 'Unit selling price'),
          money('stockValue', 'Estimated stock value'),
          text('alert', 'Alert'),
          date('lastUpdated', 'Last updated'),
        ],
        (f) => this.stockOnHand(f),
      ),
      this.definition(
        'sales-summary',
        'Sales summary',
        'Sales document totals for customer sales only. Product/brand filters select documents containing matching products; totals remain document-wide. The selected status is shown in the report header.',
        ReportParameterWindowId.Sales,
        [
          date('date', 'Date'),
          text('reference', 'Sales reference'),
          text('branch', 'Branch'),
          text('customer', 'Customer'),
          text('status', 'Status'),
          quantity('units', 'Item quantity'),
          money('subtotal', 'Subtotal'),
          text('discountType', 'Discount type'),
          money('discount', 'Discount'),
          money('netTotal', 'Net total'),
        ],
        (f) => this.salesSummary(f),
      ),
      this.definition(
        'low-stock',
        'Low / out-of-stock',
        'Inventory below the configured threshold. Replenishment estimates use selling price because purchase cost history is not consistently stored.',
        ReportParameterWindowId.LowStock,
        [
          text('branch', 'Branch'),
          text('product', 'Product'),
          text('brand', 'Brand'),
          quantity('onHand', 'On hand'),
          quantity('reserved', 'Reserved'),
          quantity('available', 'Available'),
          quantity('threshold', 'Threshold'),
          text('alert', 'Alert'),
          date('lastUpdated', 'Last updated'),
          quantity('needed', 'Units needed'),
          money('replenishmentValue', 'Estimated replenishment value'),
        ],
        (f) => this.lowStock(f),
      ),
      this.definition(
        'inventory-valuation',
        'Inventory valuation',
        'Uses the current stock overview snapshot filtered by its last-updated date; it cannot recreate historical quantities. Values are units multiplied by current selling price, not accounting cost.',
        ReportParameterWindowId.InventoryValuation,
        [
          text('branch', 'Branch'),
          text('product', 'Product'),
          text('brand', 'Brand'),
          quantity('valuationUnits', 'Units valued'),
          money('unitPrice', 'Unit selling price'),
          money('extendedValue', 'Estimated retail value'),
          date('lastUpdated', 'Last updated'),
        ],
        (f) => this.inventoryValuation(f),
      ),
      this.definition(
        'stock-movement',
        'Stock movement ledger',
        'Approved, pending, and rejected inventory documents with product-level detail and meaningful transaction references.',
        ReportParameterWindowId.StockMovement,
        [
          date('movementDate', 'Date'),
          text('reference', 'Transaction reference'),
          text('branch', 'Branch'),
          text('movementType', 'Movement'),
          text('status', 'Status'),
          text('party', 'Customer / vendor'),
          text('product', 'Product'),
          quantity('quantity', 'Units'),
          money('unitPrice', 'Unit price'),
          money('lineDiscount', 'Line discount'),
          money('lineTotal', 'Line total'),
          text('reason', 'Reason'),
          text('comments', 'Comments'),
        ],
        (f) => this.stockMovement(f),
      ),
      this.definition(
        'dead-slow-stock',
        'Dead / slow stock',
        'Stock with no approved matching movement in the selected number of days. Tied-up value is estimated at current selling price.',
        ReportParameterWindowId.DeadSlowStock,
        [
          text('branch', 'Branch'),
          text('product', 'Product'),
          text('brand', 'Brand'),
          quantity('onHand', 'On hand'),
          quantity('reserved', 'Reserved'),
          quantity('available', 'Available'),
          date('lastMovement', 'Last movement'),
          quantity('daysSinceMovement', 'Days since movement'),
          money('unitPrice', 'Unit selling price'),
          money('tiedValue', 'Estimated tied-up value'),
        ],
        (f) => this.deadSlowStock(f),
      ),
      this.definition(
        'sales-by-product',
        'Sales by product / brand',
        'Approved customer sales grouped by product or brand. Margin is omitted because historical cost snapshots are not available.',
        ReportParameterWindowId.SalesByProduct,
        [
          text('group', 'Grouping'),
          text('product', 'Product'),
          text('brand', 'Brand'),
          quantity('units', 'Units sold'),
          money('subtotal', 'Sales subtotal'),
          money('discount', 'Discount'),
          money('netSales', 'Net sales'),
          money('averagePrice', 'Average selling price'),
        ],
        (f) => this.salesByProduct(f),
      ),
      this.definition(
        'customer-sales-returns',
        'Customer sales & returns',
        'Customer sales and returns are shown separately. Return rate is returned units divided by sold units.',
        ReportParameterWindowId.CustomerSalesReturns,
        [
          text('customer', 'Customer'),
          date('date', 'Date'),
          text('reference', 'Transaction reference'),
          text('product', 'Product'),
          text('brand', 'Brand'),
          text('transactionType', 'Transaction type'),
          quantity('units', 'Units'),
          money('gross', 'Gross amount'),
          money('discount', 'Discount'),
          money('net', 'Net amount'),
          text('status', 'Status'),
        ],
        (f) => this.customerSalesReturns(f),
      ),
      this.definition(
        'discount-impact',
        'Discount impact',
        'Discounts are reported from line discounts when present; otherwise the document discount is used. The same discount is never added twice.',
        ReportParameterWindowId.DiscountImpact,
        [
          text('reference', 'Transaction reference'),
          date('date', 'Date'),
          text('branch', 'Branch'),
          text('customer', 'Customer'),
          text('product', 'Product'),
          money('subtotal', 'Subtotal'),
          text('discountType', 'Discount type'),
          money('discount', 'Applied discount'),
          money('netTotal', 'Net total'),
        ],
        (f) => this.discountImpact(f),
      ),
      this.definition(
        'vendor-purchase-summary',
        'Vendor purchase summary',
        'Inbound vendor purchase documents, product details, and net purchasing value. Sales returns are excluded.',
        ReportParameterWindowId.VendorPurchaseSummary,
        [
          text('vendor', 'Vendor'),
          text('reference', 'Purchase reference'),
          date('date', 'Date'),
          text('branch', 'Branch'),
          text('product', 'Product'),
          text('brand', 'Brand'),
          quantity('units', 'Units received'),
          money('subtotal', 'Subtotal'),
          money('discount', 'Discount'),
          money('netTotal', 'Net total'),
        ],
        (f) => this.vendorPurchases(f),
      ),
      this.definition(
        'transfer-performance',
        'Transfer performance',
        'Transfer lifecycle, branch route, requester, and completion timing. Transfer references use a readable generated label where no business number exists.',
        ReportParameterWindowId.TransferPerformance,
        [
          text('reference', 'Transfer reference'),
          date('requested', 'Request date'),
          date('expected', 'Expected date'),
          text('fromBranch', 'From branch'),
          text('toBranch', 'To branch'),
          text('requester', 'Requester'),
          text('status', 'Status'),
          quantity('itemCount', 'Product count'),
          quantity('requestedUnits', 'Requested units'),
          text('stockOutReference', 'Linked stock-out reference'),
          text('stockInReference', 'Linked stock-in reference'),
          quantity('daysOpen', 'Days open / to complete'),
        ],
        (f) => this.transferPerformance(f),
      ),
      this.definition(
        'transfer-fill-rate',
        'Transfer fill rate',
        'Fill rate is received units divided by requested units. Shipped and received quantities are read from linked stock movement details.',
        ReportParameterWindowId.TransferFillRate,
        [
          text('reference', 'Transfer reference'),
          text('route', 'Route'),
          text('product', 'Product'),
          quantity('requested', 'Requested'),
          quantity('shipped', 'Shipped'),
          quantity('received', 'Received'),
          quantity('shortfall', 'Shortfall'),
          text('status', 'Status'),
          quantity('fillRate', 'Fill rate (%)'),
        ],
        (f) => this.transferFillRate(f),
      ),
      this.definition(
        'workflow-aging',
        'Request / workflow aging',
        'Age is measured from request creation to today for open requests, or to completion/approval date for closed requests.',
        ReportParameterWindowId.WorkflowAging,
        [
          text('reference', 'Request reference'),
          text('type', 'Request type'),
          text('sourceBranch', 'Source branch'),
          text('destinationBranch', 'Destination branch'),
          text('requestedBy', 'Requested by'),
          date('requestedOn', 'Requested on'),
          text('assignedTo', 'Assigned to'),
          text('status', 'Status'),
          text('approvedBy', 'Approved by'),
          date('approvedOn', 'Approved on'),
          quantity('ageDays', 'Age (days)'),
          text('remarks', 'Remarks'),
        ],
        (f) => this.workflowAging(f),
      ),
      this.definition(
        'branch-comparison',
        'Branch comparison',
        'Period sales and transfer activity are separated from current stock snapshots; inventory values use current selling prices.',
        ReportParameterWindowId.BranchComparison,
        [
          text('branch', 'Branch'),
          money('sales', 'Period sales'),
          money('returns', 'Period returns'),
          money('netSales', 'Net sales'),
          quantity('unitsSold', 'Units sold'),
          quantity('stockUnits', 'Current stock units'),
          money('stockValue', 'Current estimated retail value'),
          quantity('lowSkus', 'Low-stock SKUs'),
          quantity('transferIn', 'Transfers in'),
          quantity('transferOut', 'Transfers out'),
          quantity('transferInUnits', 'Transfer-in units'),
          quantity('transferOutUnits', 'Transfer-out units'),
        ],
        (f) => this.branchComparison(f),
      ),
      this.definition(
        'approver-throughput',
        'Approver / team throughput',
        'Turnaround is measured from request date to approval date for approved/rejected requests; pending requests remain open workload.',
        ReportParameterWindowId.ApproverThroughput,
        [
          text('user', 'User / approver'),
          text('manager', 'Manager / team'),
          text('branch', 'Branch'),
          text('requestType', 'Request type'),
          quantity('assignedCount', 'Assigned'),
          quantity('approvedCount', 'Approved'),
          quantity('rejectedCount', 'Rejected'),
          quantity('completedCount', 'Completed'),
          quantity('averageTurnaround', 'Average turnaround (days)'),
          quantity('pendingCount', 'Pending'),
        ],
        (f) => this.approverThroughput(f),
      ),
    ];
  }

  private definition(
    id: string,
    title: string,
    description: string,
    parameterWindowId: ReportParameterWindowId,
    columns: ReportColumn[],
    loader: Loader,
  ): ReportDefinition<Row> {
    const rows = (filters: ReportFilters): Promise<Row[]> =>
      this.cached(id, filters, () => loader(filters));
    return {
      id,
      title,
      description,
      columns,
      parameterWindowId,
      header: (filters) => this.commonHeader(title, filters),
      loadPage: async ({ filters, pageIndex, pageSize }) => {
        const all = await rows(filters);
        return {
          rows: all.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
          total: all.length,
        };
      },
      loadAll: (filters) => rows(filters),
      loadAggregates: async (filters) => this.aggregates(id, await rows(filters)),
    };
  }

  private cached(id: string, filters: ReportFilters, load: Loader): Promise<Row[]> {
    const key = `${id}:${JSON.stringify(filters)}`;
    const current = this.cache.get(key);
    if (current && current.expires > Date.now()) return current.value;
    if (this.cache.size > 30) this.cache.delete(this.cache.keys().next().value!);
    const value = load(filters);
    this.cache.set(key, { expires: Date.now() + 30_000, value });
    return value;
  }

  private commonHeader(title: string, filters: ReportFilters) {
    const session = this.auth.currentSession();
    const custom = filters.customValues || {};
    const branchIds = session?.branches || [];
    const branchScope =
      custom['branchLabel'] ||
      (filters.branchId
        ? custom['branchIdLabel'] || 'Selected branch'
        : branchIds.some((item) => item.branchid === '0')
          ? 'All permitted branches'
          : branchIds.map((item) => item.name).join(', ') || 'No branch access');
    const active = String(custom['appliedFilters'] || '');
    const fields = [
      { label: 'Report', value: title },
      { label: 'Organization / IMS', value: this.settings.title },
      { label: 'Branch scope', value: branchScope },
      ...(filters.fromDate
        ? [{ label: 'Period from', value: this.formatDate(filters.fromDate) }]
        : []),
      ...(filters.toDate ? [{ label: 'Period to', value: this.formatDate(filters.toDate) }] : []),
      { label: 'Generated at', value: new Date().toLocaleString() },
      { label: 'Generated by', value: session?.name || 'Current user' },
      { label: 'Currency', value: `${this.settings.currencyName} (${this.settings.currencyCode})` },
      { label: 'Unit of measure', value: 'Units' },
      ...(active ? [{ label: 'Applied filters', value: active }] : []),
    ];
    if (['Stock on hand', 'Inventory valuation', 'Dead / slow stock'].includes(title))
      fields.splice(3, 0, { label: 'As of date', value: new Date().toLocaleDateString() });
    if (title === 'Customer sales & returns')
      fields.push({ label: 'Return rate', value: 'Returned units ÷ sold units' });
    if (title === 'Discount impact')
      fields.push({
        label: 'Discount basis',
        value: 'Line discount when present; otherwise allocated document discount',
      });
    if (title === 'Transfer fill rate')
      fields.push({ label: 'Fill-rate basis', value: 'Received units ÷ requested units' });
    if (title === 'Branch comparison')
      fields.push({
        label: 'Measure periods',
        value: 'Sales and transfers use selected period; inventory is current snapshot',
      });
    if (title === 'Approver / team throughput')
      fields.push({
        label: 'Period basis',
        value: String(custom['periodBasis'] || 'Requests received'),
      });
    if (title === 'Sales summary')
      fields.push({
        label: 'Included statuses',
        value: String(custom['status'] || 'All statuses'),
      });
    return fields;
  }

  private async stockOnHand(filters: ReportFilters): Promise<Row[]> {
    const [records, branches, products] = await Promise.all([
      this.overview(filters),
      this.branchNames(),
      this.productMap(),
    ]);
    const threshold = Number(filters.customValues?.['threshold'] || 2);
    const alert = String(filters.customValues?.['alert'] || '');
    return records
      .map((record) => this.mapOverview(record, branches, products, threshold))
      .filter((row) => !alert || row['alert'] === alert);
  }

  private async salesSummary(filters: ReportFilters): Promise<Row[]> {
    const [headers, branches, customers, products] = await Promise.all([
      this.stockHeaders(filters, 'out'),
      this.branchNames(),
      this.customerNames(),
      this.productMap(),
    ]);
    const selectedStatus = String(filters.customValues?.['status'] || 'Approved');
    const docs = headers.filter(
      (item) => String(item['status']) === selectedStatus && !!item['customerid'],
    );
    const productId = String(filters.customValues?.['productId'] || '');
    const brandId = String(filters.customValues?.['brandId'] || '');
    if (productId || brandId) {
      const details = await this.getStockDetails(docs.map((item) => item.__key));
      return docs
        .filter((item) =>
          (details.get(item.__key) || []).some((line) => {
            const product = products.get(String(line['productid'] || ''));
            return (
              (!productId || productId === line['productid']) &&
              (!brandId || brandId === product?.brandId)
            );
          }),
        )
        .map((item) => this.mapSalesSummary(item, branches, customers));
    }
    return docs.map((item) => this.mapSalesSummary(item, branches, customers));
  }

  private mapSalesSummary(
    raw: Raw,
    branches: Map<string, string>,
    customers: Map<string, string>,
  ): Row {
    return {
      date: this.asDate(raw['entrydate']),
      reference: this.reference(raw),
      branch: String(
        raw['branchName'] || branches.get(String(raw['branchid'] || '')) || 'Branch unavailable',
      ),
      customer:
        customers.get(String(raw['customerid'])) ||
        String(raw['customerName'] || 'Customer unavailable'),
      status: String(raw['status'] || 'Unknown'),
      units: Number(raw['quantity'] || 0),
      subtotal: Number(raw['subtotal'] || 0),
      discountType: String(raw['discounttype'] || 'None'),
      discount: this.documentDiscountAmount(raw),
      netTotal: Number(raw['NetTotal'] || 0),
    };
  }

  private async overview(filters: ReportFilters): Promise<Raw[]> {
    const constraints: QueryConstraint[] = [];
    const productId = String(filters.customValues?.['productId'] || '');
    const brandId = String(filters.customValues?.['brandId'] || '');
    if (productId) constraints.push(where('productid', '==', productId));
    if (brandId) constraints.push(where('brandid', '==', brandId));
    const from =
      filters.customValues?.['updatedFrom'] ||
      filters.customValues?.['asOfDate'] ||
      filters.fromDate;
    const to =
      filters.customValues?.['updatedTo'] || filters.customValues?.['asOfDate'] || filters.toDate;
    if (from)
      constraints.push(
        where('lastUpdated', '>=', Timestamp.fromDate(this.dayStart(from as string | Date))),
      );
    if (to)
      constraints.push(
        where('lastUpdated', '<=', Timestamp.fromDate(this.dayEnd(to as string | Date))),
      );
    return this.branchScoped(
      'inventory_stock_overview',
      'branchid',
      (filters.customValues?.['branchId'] as string) || filters.branchId,
      constraints,
    );
  }

  private async stockHeaders(
    filters: ReportFilters,
    type?: 'in' | 'out',
    applyPeriod = true,
  ): Promise<Raw[]> {
    const constraints: QueryConstraint[] = [];
    if (type) constraints.push(where('stocktype', '==', type));
    if (applyPeriod && filters.fromDate)
      constraints.push(
        where('entrydate', '>=', Timestamp.fromDate(this.dayStart(filters.fromDate))),
      );
    if (applyPeriod && filters.toDate)
      constraints.push(where('entrydate', '<=', Timestamp.fromDate(this.dayEnd(filters.toDate))));
    const docs = await this.branchScoped(
      'inventory_stocks',
      'branchid',
      (filters.customValues?.['branchId'] as string) || filters.branchId,
      constraints,
    );
    const vendorId = String(filters.customValues?.['vendorId'] || '');
    const customerId = String(filters.customValues?.['customerId'] || '');
    return docs.filter(
      (item) =>
        (!vendorId || String(item['vendorid'] || '') === vendorId) &&
        (!customerId || String(item['customerid'] || '') === customerId),
    );
  }

  private async branchScoped(
    name: string,
    branchField: string,
    selected: string,
    constraints: QueryConstraint[] = [],
  ): Promise<Raw[]> {
    const allowed = this.auth.currentSession()?.branches || [];
    const all = allowed.some((item) => item.branchid === '0');
    const ids = [...new Set(allowed.map((item) => item.branchid).filter((id) => id && id !== '0'))];
    if (selected && selected !== '0') {
      if (!all && !ids.includes(selected)) return [];
      const docs = await getDocs(
        query(collection(firestore, name), where(branchField, '==', selected), ...constraints),
      );
      return docs.docs.map((item) => ({ ...item.data(), __key: item.id }));
    }
    if (all) {
      const docs = await getDocs(query(collection(firestore, name), ...constraints));
      return docs.docs.map((item) => ({ ...item.data(), __key: item.id }));
    }
    if (!ids.length) return [];
    const batches: string[][] = [];
    for (let i = 0; i < ids.length; i += 30) batches.push(ids.slice(i, i + 30));
    const snapshots = await Promise.all(
      batches.map((batch) =>
        getDocs(
          query(collection(firestore, name), where(branchField, 'in', batch), ...constraints),
        ),
      ),
    );
    const seen = new Set<string>();
    return snapshots.flatMap((snapshot) =>
      snapshot.docs
        .filter((item) => !seen.has(item.id) && !!seen.add(item.id))
        .map((item) => ({ ...item.data(), __key: item.id })),
    );
  }

  private async getStockDetails(ids: string[]): Promise<Map<string, Raw[]>> {
    const result = new Map<string, Raw[]>();
    const keys = [...new Set(ids.filter(Boolean))];
    for (let i = 0; i < keys.length; i += 30) {
      const batch = keys.slice(i, i + 30);
      const snapshot = await getDocs(
        query(collection(firestore, 'inventory_stocks_details'), where('stockid', 'in', batch)),
      );
      for (const doc of snapshot.docs) {
        const row = { ...doc.data(), __key: doc.id } as Raw;
        const id = String(row['stockid'] || '');
        result.set(id, [...(result.get(id) || []), row]);
      }
    }
    return result;
  }

  private async branchNames(): Promise<Map<string, string>> {
    return (this.branches ||= this.branchService
      .getBranches()
      .then((items) => new Map(items.map((item) => [item.branchid, item.name]))));
  }
  private async productMap(): Promise<
    Map<string, { name: string; brandId: string; brand: string; price: number }>
  > {
    return (this.products ||= Promise.all([
      this.productService.getProducts(),
      this.brandNames(),
    ]).then(
      ([items, brandMap]) =>
        new Map(
          items.map((item) => [
            item.id || '',
            {
              name: item.name,
              brandId: item.brandId || '',
              brand: item.brand || brandMap.get(item.brandId) || 'Brand unavailable',
              price: Number(item.price || 0),
            },
          ]),
        ),
    ));
  }
  private async brandNames(): Promise<Map<string, string>> {
    return (this.brands ||= this.brandService
      .getBrands()
      .then((items) => new Map(items.map((item) => [item.id || '', item.name]))));
  }
  private async customerNames(): Promise<Map<string, string>> {
    return (this.customers ||= this.customerService
      .getCustomers()
      .then((items) => new Map(items.map((item) => [item.id || '', item.name]))));
  }
  private async vendorNames(): Promise<Map<string, string>> {
    return (this.vendors ||= this.vendorService
      .getVendors()
      .then((items) => new Map(items.map((item) => [item.id || '', item.name]))));
  }
  private async userNames(): Promise<Map<string, string>> {
    return (this.users ||= this.userService
      .getUsers()
      .then((items) => new Map(items.map((item) => [item.userid || '', item.name]))));
  }

  private async lowStock(filters: ReportFilters): Promise<Row[]> {
    const [rows, branches, products] = await Promise.all([
      this.overview(filters),
      this.branchNames(),
      this.productMap(),
    ]);
    const custom = filters.customValues || {};
    const threshold = Number(custom['threshold'] || 2);
    return rows
      .map((r): Row => {
        const row = this.mapOverview(r, branches, products, threshold);
        const available = Number(row['available']);
        row['alert'] = available <= 0 ? 'Empty' : available <= threshold ? 'Low' : 'Healthy';
        return row;
      })
      .filter((row) => {
        const alert = String(row['alert']);
        const wantedAlert = String(custom['alert'] || '');
        return (
          Number(row['available']) <= threshold &&
          (!wantedAlert || wantedAlert === alert) &&
          Number(row['onHand']) >= Number(custom['minimumOnHand'] || 0)
        );
      })
      .map((row) => ({
        ...row,
        threshold,
        needed: Math.max(0, threshold - Number(row['available'])),
        replenishmentValue:
          Math.max(0, threshold - Number(row['available'])) * Number(row['unitPrice']),
      }));
  }

  private async inventoryValuation(filters: ReportFilters): Promise<Row[]> {
    const [rows, branches, products] = await Promise.all([
      this.overview(filters),
      this.branchNames(),
      this.productMap(),
    ]);
    const basis = String(filters.customValues?.['basis'] || 'on-hand');
    return rows.map((r) => {
      const row = this.mapOverview(r, branches, products);
      const units = basis === 'available' ? Number(row['available']) : Number(row['onHand']);
      return { ...row, valuationUnits: units, extendedValue: units * Number(row['unitPrice']) };
    });
  }

  private mapOverview(
    raw: Raw,
    branches: Map<string, string>,
    products: Map<string, { name: string; brandId: string; brand: string; price: number }>,
    threshold = 2,
  ): Row {
    const productId = String(raw['productid'] || '');
    const product = products.get(productId);
    const onHand = Number(raw['balanceQuantity'] ?? raw['quantity'] ?? 0);
    const reserved = Number(raw['reservedQuantity'] || 0);
    const available = onHand - reserved;
    const price = Number(raw['price'] ?? product?.price ?? 0);
    const storedAlert = String(raw['alert'] || '');
    const alert =
      storedAlert || (available <= 0 ? 'Empty' : available <= threshold ? 'Low' : 'Healthy');
    return {
      branch: String(
        raw['branchName'] || branches.get(String(raw['branchid'] || '')) || 'Branch unavailable',
      ),
      product: String(raw['productName'] || product?.name || 'Product unavailable'),
      brand: String(raw['brandName'] || product?.brand || 'Brand unavailable'),
      onHand,
      reserved,
      available,
      unitPrice: price,
      stockValue: onHand * price,
      alert,
      lastUpdated: this.asDate(raw['lastUpdated']),
      __branchProductKey: `${raw['branchid']}|${raw['productid']}`,
    };
  }

  private async stockMovement(filters: ReportFilters): Promise<Row[]> {
    const [headers, branches, products, customers, vendors] = await Promise.all([
      this.stockHeaders(filters),
      this.branchNames(),
      this.productMap(),
      this.customerNames(),
      this.vendorNames(),
    ]);
    const selectedType = String(filters.customValues?.['stocktype'] || '');
    const selectedStatus = String(filters.customValues?.['status'] || '');
    const matching = headers.filter(
      (h) =>
        (!selectedType || String(h['stocktype']) === selectedType) &&
        (!selectedStatus || String(h['status']) === selectedStatus),
    );
    const details = await this.getStockDetails(matching.map((h) => h.__key));
    const custom = filters.customValues || {};
    const out: Row[] = [];
    for (const header of matching) {
      const type = String(header['stocktype'] || '');
      const customerId = String(header['customerid'] || '');
      const vendorId = String(header['vendorid'] || '');
      const party = customerId
        ? customers.get(customerId) || String(header['customerName'] || 'Customer unavailable')
        : vendorId
          ? vendors.get(vendorId) || String(header['vendorName'] || 'Vendor unavailable')
          : 'Not recorded';
      let detailIndex = 0;
      for (const line of details.get(header.__key) || []) {
        const productId = String(line['productid'] || '');
        const product = products.get(productId);
        const reason = String(line['reason'] || 'Not recorded');
        if (custom['productId'] && custom['productId'] !== productId) continue;
        if (custom['brandId'] && custom['brandId'] !== product?.brandId) continue;
        if (
          custom['reason'] &&
          !reason.toLowerCase().includes(String(custom['reason']).toLowerCase())
        )
          continue;
        out.push({
          transactionKey: header.__key,
          direction: type,
          documentNet: detailIndex++ === 0 ? Number(header['NetTotal'] || 0) : 0,
          movementDate: this.asDate(header['entrydate']),
          reference: this.reference(header),
          branch: String(
            header['branchName'] ||
              branches.get(String(header['branchid'] || '')) ||
              'Branch unavailable',
          ),
          movementType: type === 'in' ? 'Inbound' : 'Outbound',
          status: String(header['status'] || 'Unknown'),
          party,
          product: product?.name || String(line['productName'] || 'Product unavailable'),
          quantity: Number(line['quantity'] || 0),
          unitPrice: Number(line['unitprice'] || 0),
          lineDiscount: Number(line['discount'] || 0),
          lineTotal: Number(line['total'] || 0),
          reason,
          comments: String(line['comments'] || header['remarks'] || ''),
        });
      }
    }
    return out.sort((a, b) => this.time(b['movementDate']) - this.time(a['movementDate']));
  }

  private async filterHeadersByProduct(headers: Raw[], filters: ReportFilters): Promise<Raw[]> {
    const productId = String(filters.customValues?.['productId'] || '');
    const brandId = String(filters.customValues?.['brandId'] || '');
    if (!productId && !brandId) return headers;
    const [details, products] = await Promise.all([
      this.getStockDetails(headers.map((item) => item.__key)),
      this.productMap(),
    ]);
    return headers.filter((header) =>
      (details.get(header.__key) || []).some((line) => {
        const product = products.get(String(line['productid'] || ''));
        return (
          (!productId || line['productid'] === productId) &&
          (!brandId || product?.brandId === brandId)
        );
      }),
    );
  }

  private async deadSlowStock(filters: ReportFilters): Promise<Row[]> {
    const [overview, branches, products] = await Promise.all([
      this.overview(filters),
      this.branchNames(),
      this.productMap(),
    ]);
    const custom = filters.customValues || {};
    const duration = Math.max(1, Number(custom['noMovementDays'] || 90));
    const minimum = Number(custom['minimumOnHand'] || 0);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - duration);
    const recentFilters = { ...filters, fromDate: cutoff, toDate: null };
    const headers = (await this.stockHeaders(recentFilters)).filter(
      (item) => String(item['status']) === 'Approved',
    );
    const details = await this.getStockDetails(headers.map((item) => item.__key));
    const lastMovement = new Map<string, Date>();
    for (const header of headers)
      for (const line of details.get(header.__key) || []) {
        const key = `${header['branchid']}|${line['productid']}`;
        const when = this.asDate(header['entrydate']);
        if (when && (!lastMovement.has(key) || when > lastMovement.get(key)!))
          lastMovement.set(key, when);
      }
    return overview
      .map((raw): Row => {
        const row: Row = this.mapOverview(raw, branches, products);
        const key = `${raw['branchid']}|${raw['productid']}`;
        const movement = lastMovement.get(key);
        const dayCount = movement
          ? Math.floor((Date.now() - movement.getTime()) / 86_400_000)
          : duration;
        return {
          ...row,
          lastMovement: movement || `No movement ≥ ${duration} days`,
          daysSinceMovement: movement ? dayCount : `≥ ${duration}`,
          tiedValue: Number(row['onHand']) * Number(row['unitPrice']),
        };
      })
      .filter(
        (row) => Number(row['onHand']) >= minimum && Number(row['daysSinceMovement']) >= duration,
      );
  }

  private async salesByProduct(filters: ReportFilters): Promise<Row[]> {
    const [headers, products] = await Promise.all([
      this.stockHeaders(filters, 'out'),
      this.productMap(),
    ]);
    const custom = filters.customValues || {};
    const selectedStatus = String(custom['status'] || 'Approved');
    const sales = headers.filter(
      (h) => String(h['status']) === selectedStatus && !!h['customerid'],
    );
    const detailMap = await this.getStockDetails(sales.map((h) => h.__key));
    const aggregate = new Map<string, Row>();
    const groupBy = String(custom['groupBy'] || 'product');
    for (const header of sales) {
      const lines = detailMap.get(header.__key) || [];
      const grossTotal = lines.reduce(
        (sum, line) => sum + Number(line['unitprice'] || 0) * Number(line['quantity'] || 0),
        0,
      );
      const hasLineDiscounts = lines.some((line) => Number(line['discount'] || 0) > 0);
      const documentDiscount = this.documentDiscountAmount(header);
      for (const line of lines) {
        const productId = String(line['productid'] || '');
        const product = products.get(productId);
        if (custom['productId'] && custom['productId'] !== productId) continue;
        if (custom['brandId'] && custom['brandId'] !== product?.brandId) continue;
        const key = groupBy === 'brand' ? product?.brandId || 'unknown' : productId;
        const current = aggregate.get(key) || {
          group: groupBy === 'brand' ? 'Brand' : 'Product',
          product:
            groupBy === 'brand'
              ? product?.brand || 'Brand unavailable'
              : product?.name || String(line['productName'] || 'Product unavailable'),
          brand: product?.brand || 'Brand unavailable',
          units: 0,
          subtotal: 0,
          discount: 0,
          netSales: 0,
          averagePrice: 0,
        };
        const units = Number(line['quantity'] || 0);
        const gross = Number(line['unitprice'] || 0) * units;
        const discount = hasLineDiscounts
          ? Number(line['discount'] || 0)
          : grossTotal
            ? (documentDiscount * gross) / grossTotal
            : 0;
        const net = gross - discount;
        current['units'] = Number(current['units']) + units;
        current['subtotal'] = Number(current['subtotal']) + gross;
        current['discount'] = Number(current['discount']) + discount;
        current['netSales'] = Number(current['netSales']) + net;
        current['averagePrice'] = Number(current['units'])
          ? Number(current['netSales']) / Number(current['units'])
          : 0;
        aggregate.set(key, current);
      }
    }
    return [...aggregate.values()].sort((a, b) => Number(b['netSales']) - Number(a['netSales']));
  }

  private async customerSalesReturns(filters: ReportFilters): Promise<Row[]> {
    const [outs, ins, products, customers] = await Promise.all([
      this.stockHeaders(filters, 'out'),
      this.stockHeaders(filters, 'in'),
      this.productMap(),
      this.customerNames(),
    ]);
    const status = String(filters.customValues?.['status'] || 'Approved');
    const sales = outs.filter((h) => String(h['status']) === status && !!h['customerid']);
    const returns = ins.filter((h) => String(h['status']) === status && !!h['customerid']);
    const headers: (Raw & { __direction: string })[] = [
      ...sales.map((item) => ({ ...item, __direction: 'Sale' })),
      ...returns.map((item) => ({ ...item, __direction: 'Return' })),
    ];
    const details = await this.getStockDetails(headers.map((item) => item.__key));
    const rows: Row[] = [];
    const custom = filters.customValues || {};
    for (const header of headers) {
      const lines = details.get(header.__key) || [];
      const grossTotal = lines.reduce(
        (sum, line) => sum + Number(line['unitprice'] || 0) * Number(line['quantity'] || 0),
        0,
      );
      const hasLineDiscounts = lines.some((line) => Number(line['discount'] || 0) > 0);
      const documentDiscount = this.documentDiscountAmount(header);
      for (const line of lines) {
        const productId = String(line['productid'] || '');
        const product = products.get(productId);
        if (custom['productId'] && custom['productId'] !== productId) continue;
        if (custom['brandId'] && custom['brandId'] !== product?.brandId) continue;
        if (custom['transactionType'] === 'sales' && header['__direction'] !== 'Sale') continue;
        if (custom['transactionType'] === 'return' && header['__direction'] !== 'Return') continue;
        const sign = header['__direction'] === 'Return' ? -1 : 1;
        const units = Number(line['quantity'] || 0);
        const gross = Number(line['unitprice'] || 0) * units;
        const discount = hasLineDiscounts
          ? Number(line['discount'] || 0)
          : grossTotal
            ? (documentDiscount * gross) / grossTotal
            : 0;
        rows.push({
          customer:
            customers.get(String(header['customerid'])) ||
            String(header['customerName'] || 'Customer unavailable'),
          date: this.asDate(header['entrydate']),
          reference: this.reference(header),
          product: product?.name || String(line['productName'] || 'Product unavailable'),
          brand: product?.brand || 'Brand unavailable',
          transactionType: header['__direction'],
          units: sign * units,
          gross: sign * gross,
          discount: sign * discount,
          net: sign * (gross - discount),
          status: String(header['status'] || 'Unknown'),
        });
      }
    }
    return rows;
  }

  private async vendorPurchases(filters: ReportFilters): Promise<Row[]> {
    const [headers, branches, vendors, products] = await Promise.all([
      this.stockHeaders(filters, 'in'),
      this.branchNames(),
      this.vendorNames(),
      this.productMap(),
    ]);
    const status = String(filters.customValues?.['status'] || 'Approved');
    const selected = headers.filter(
      (header) => String(header['status']) === status && !!header['vendorid'],
    );
    const detailMap = await this.getStockDetails(selected.map((h) => h.__key));
    const custom = filters.customValues || {};
    const rows: Row[] = [];
    for (const header of selected) {
      const lines = detailMap.get(header.__key) || [];
      const match = lines.filter((line) => {
        const product = products.get(String(line['productid'] || ''));
        return (
          (!custom['productId'] || custom['productId'] === line['productid']) &&
          (!custom['brandId'] || custom['brandId'] === product?.brandId)
        );
      });
      const grossTotal = lines.reduce(
        (sum, line) => sum + Number(line['unitprice'] || 0) * Number(line['quantity'] || 0),
        0,
      );
      const hasLineDiscounts = lines.some((line) => Number(line['discount'] || 0) > 0);
      const documentDiscount = this.documentDiscountAmount(header);
      for (const line of match) {
        const product = products.get(String(line['productid'] || ''));
        const gross = Number(line['unitprice'] || 0) * Number(line['quantity'] || 0);
        const discount = hasLineDiscounts
          ? Number(line['discount'] || 0)
          : grossTotal
            ? (documentDiscount * gross) / grossTotal
            : 0;
        rows.push({
          vendor:
            vendors.get(String(header['vendorid'])) ||
            String(header['vendorName'] || 'Vendor unavailable'),
          reference: this.reference(header),
          date: this.asDate(header['entrydate']),
          branch: String(
            header['branchName'] ||
              branches.get(String(header['branchid'] || '')) ||
              'Branch unavailable',
          ),
          product: product?.name || String(line['productName'] || 'Product unavailable'),
          brand: product?.brand || 'Brand unavailable',
          units: Number(line['quantity'] || 0),
          subtotal: gross,
          discount,
          netTotal: gross - discount,
          documentKey: header.__key,
          documentSubtotal: Number(header['subtotal'] || 0),
          documentDiscount,
          documentNet: Number(header['NetTotal'] || 0),
        });
      }
    }
    return rows;
  }

  private async discountImpact(filters: ReportFilters): Promise<Row[]> {
    const [headers, branches, products, customers] = await Promise.all([
      this.stockHeaders(filters, 'out'),
      this.branchNames(),
      this.productMap(),
      this.customerNames(),
    ]);
    const status = String(filters.customValues?.['status'] || 'Approved');
    const docs = headers.filter(
      (header) => String(header['status']) === status && !!header['customerid'],
    );
    const detailMap = await this.getStockDetails(docs.map((h) => h.__key));
    const custom = filters.customValues || {};
    const rows: Row[] = [];
    for (const header of docs) {
      const lines = (detailMap.get(header.__key) || []).filter((line) => {
        const product = products.get(String(line['productid'] || ''));
        return (
          (!custom['productId'] || custom['productId'] === line['productid']) &&
          (!custom['brandId'] || custom['brandId'] === product?.brandId)
        );
      });
      const lineDiscountTotal = lines.reduce((sum, line) => sum + Number(line['discount'] || 0), 0);
      const documentDiscount = this.documentDiscountAmount(header);
      const useLines = lineDiscountTotal > 0;
      const base = lines.reduce(
        (sum, line) => sum + Number(line['unitprice'] || 0) * Number(line['quantity'] || 0),
        0,
      );
      for (const line of lines) {
        const product = products.get(String(line['productid'] || ''));
        const weight = base
          ? (Number(line['unitprice'] || 0) * Number(line['quantity'] || 0)) / base
          : 0;
        const discount = useLines ? Number(line['discount'] || 0) : documentDiscount * weight;
        rows.push({
          reference: this.reference(header),
          date: this.asDate(header['entrydate']),
          branch: String(
            header['branchName'] ||
              branches.get(String(header['branchid'] || '')) ||
              'Branch unavailable',
          ),
          customer:
            customers.get(String(header['customerid'])) ||
            String(header['customerName'] || 'Customer unavailable'),
          product: product?.name || String(line['productName'] || 'Product unavailable'),
          subtotal: Number(line['unitprice'] || 0) * Number(line['quantity'] || 0),
          discountType: `${String(header['discounttype'] || 'document')} · ${useLines ? 'line-level' : 'document-level'}`,
          discount,
          netTotal: Number(line['unitprice'] || 0) * Number(line['quantity'] || 0) - discount,
          documentKey: header.__key,
          grossDoc: Number(header['subtotal'] || 0),
          discountDoc: documentDiscount,
          netDoc: Number(header['NetTotal'] || 0),
          appliedDiscountType: useLines ? 'Line-level' : 'Document-level',
        });
      }
    }
    const filterType = String(custom['discountType'] || '');
    return filterType
      ? rows.filter((row) =>
          String(row['discountType']).toLowerCase().includes(filterType.toLowerCase()),
        )
      : rows;
  }

  private async transferRows(filters: ReportFilters): Promise<{ transfer: Raw; row: Row }[]> {
    const [transfers, branches, users] = await Promise.all([
      this.transferService.getTransfers(),
      this.branchNames(),
      this.userNames(),
    ]);
    const custom = filters.customValues || {};
    const allowed = this.auth.currentSession()?.branches || [];
    const canAll = allowed.some((item) => item.branchid === '0');
    const allowedIds = new Set(allowed.map((item) => item.branchid).filter((id) => id !== '0'));
    const selectedFrom = String(custom['fromBranchId'] || '');
    const selectedTo = String(custom['toBranchId'] || '');
    const selectedBranch =
      custom['reportId'] === 'branch-comparison' ? String(custom['branchId'] || '') : '';
    const status = String(custom['status'] || '');
    const userId = String(custom['userId'] || '');
    const matched = transfers
      .filter((item) => {
        const from = String(item.fromBranch || item.branchId || '');
        const to = String(item.toBranch || '');
        const permitted = canAll || allowedIds.has(from) || allowedIds.has(to);
        if (
          !permitted ||
          (selectedBranch && selectedBranch !== from && selectedBranch !== to) ||
          (selectedFrom && selectedFrom !== from) ||
          (selectedTo && selectedTo !== to) ||
          (status && String(item.status) !== status) ||
          (userId && String(item.userId || '') !== userId)
        )
          return false;
        const requested = this.asDate(item.requestDate);
        const expected = this.asDate(item.expectedDate);
        return (
          this.inRange(requested, filters.fromDate, filters.toDate) &&
          this.inRange(expected, custom['expectedFrom'] as string, custom['expectedTo'] as string)
        );
      })
      .sort(
        (a, b) => this.time(this.asDate(a.requestDate)) - this.time(this.asDate(b.requestDate)),
      );
    return matched.map((item, index) => {
      const fromId = String(item.fromBranch || item.branchId || '');
      const toId = String(item.toBranch || '');
      const requested = this.asDate(item.requestDate);
      const expected = this.asDate(item.expectedDate);
      const closed = ['Completed', 'Received'].includes(String(item.status));
      const elapsed = Math.max(0, Math.floor((Date.now() - this.time(requested)) / 86_400_000));
      const ref = String(
        item.transferNumber || `Transfer ${this.formatDate(requested)} · ${index + 1}`,
      );
      return {
        transfer: { ...item, __key: String(item.id || '') },
        row: {
          reference: ref,
          requested,
          expected,
          fromBranch: branches.get(fromId) || 'Branch unavailable',
          toBranch: branches.get(toId) || 'Branch unavailable',
          requester: users.get(String(item.userId || '')) || 'User unavailable',
          status: String(item.status || 'Unknown'),
          itemCount: Array.isArray(item.items)
            ? new Set(item.items.map((line) => line.productId)).size
            : 0,
          requestedUnits: (item.items || []).reduce(
            (sum, line) => sum + Number(line.quantity || 0),
            0,
          ),
          stockOutReference: 'Not linked',
          stockInReference: 'Not linked',
          daysOpen: closed ? elapsed : elapsed,
          __fromId: fromId,
          __toId: toId,
          __transferKey: String(item.id || ''),
        },
      };
    });
  }

  private async linkedStock(ids: string[]): Promise<Map<string, Raw>> {
    const keys = [...new Set(ids.filter(Boolean))];
    const result = new Map<string, Raw>();
    for (let i = 0; i < keys.length; i += 30) {
      const chunk = keys.slice(i, i + 30);
      if (!chunk.length) continue;
      const constraints = [where(documentId(), 'in', chunk)];
      const snapshot = await getDocs(
        query(collection(firestore, 'inventory_stocks'), ...constraints),
      );
      for (const item of snapshot.docs) result.set(item.id, { ...item.data(), __key: item.id });
    }
    return result;
  }

  private async transferPerformance(filters: ReportFilters): Promise<Row[]> {
    const matches = await this.transferRows(filters);
    const [outDocs, inDocs] = await Promise.all([
      this.linkedStock(matches.map((item) => String(item.transfer['stockOutId'] || ''))),
      this.linkedStock(matches.map((item) => String(item.transfer['stockInId'] || ''))),
    ]);
    return matches.map(({ transfer, row }) => {
      const inbound = inDocs.get(String(transfer['stockInId'] || ''));
      const completion = this.asDate(
        inbound?.['entrydate'] || transfer['completedAt'] || transfer['receivedAt'],
      );
      const expected = this.asDate(row['expected']);
      const closed = ['Completed', 'Received'].includes(String(row['status']));
      const days = completion
        ? Math.max(0, Math.floor((completion.getTime() - this.time(row['requested'])) / 86_400_000))
        : closed
          ? null
          : Math.max(0, Math.floor((Date.now() - this.time(row['requested'])) / 86_400_000));
      return {
        ...row,
        daysOpen: days ?? 'Completion date unavailable',
        stockOutReference: this.reference(outDocs.get(String(transfer['stockOutId'] || ''))),
        stockInReference: this.reference(inbound),
        receivedUnits: Number(inbound?.['quantity'] || 0),
        __completionDate: completion,
        __onTime: !!(completion && expected && completion <= expected),
      };
    });
  }

  private async transferFillRate(filters: ReportFilters): Promise<Row[]> {
    const [matches, products] = await Promise.all([this.transferRows(filters), this.productMap()]);
    const outs = await this.linkedStock(
      matches.map((item) => String(item.transfer['stockOutId'] || '')),
    );
    const ins = await this.linkedStock(
      matches.map((item) => String(item.transfer['stockInId'] || '')),
    );
    const outDetails = await this.getStockDetails([...outs.keys()]);
    const inDetails = await this.getStockDetails([...ins.keys()]);
    const custom = filters.customValues || {};
    const rows: Row[] = [];
    for (const { transfer, row } of matches) {
      const out = outDetails.get(String(transfer['stockOutId'] || '')) || [];
      const received = inDetails.get(String(transfer['stockInId'] || '')) || [];
      for (const item of (transfer['items'] as Array<Record<string, unknown>>) || []) {
        const productId = String(item['productId'] || '');
        const product = products.get(productId);
        if (custom['productId'] && custom['productId'] !== productId) continue;
        if (custom['brandId'] && custom['brandId'] !== product?.brandId) continue;
        const requested = Number(item['quantity'] || 0);
        const shipped = out
          .filter((line) => line['productid'] === productId)
          .reduce((sum, line) => sum + Number(line['quantity'] || 0), 0);
        const receivedUnits = received
          .filter((line) => line['productid'] === productId)
          .reduce((sum, line) => sum + Number(line['quantity'] || 0), 0);
        rows.push({
          reference: row['reference'],
          route: `${row['fromBranch']} → ${row['toBranch']}`,
          product: product?.name || String(item['productName'] || 'Product unavailable'),
          requested,
          shipped,
          received: receivedUnits,
          shortfall: Math.max(0, requested - receivedUnits),
          status: row['status'],
          fillRate: requested ? (receivedUnits / requested) * 100 : 0,
          __requested: requested,
          __shipped: shipped,
          __received: receivedUnits,
          __shortage: receivedUnits < requested,
        });
      }
    }
    return rows;
  }

  private async workflowRows(filters: ReportFilters, periodField = 'requestedOn'): Promise<Raw[]> {
    const constraints: QueryConstraint[] = [];
    if (filters.fromDate)
      constraints.push(
        where(periodField, '>=', Timestamp.fromDate(this.dayStart(filters.fromDate))),
      );
    if (filters.toDate)
      constraints.push(where(periodField, '<=', Timestamp.fromDate(this.dayEnd(filters.toDate))));
    const snapshot = await getDocs(
      query(collection(firestore, 'workflow_requests'), ...constraints),
    );
    const allowed = this.auth.currentSession()?.branches || [];
    const canAll = allowed.some((item) => item.branchid === '0');
    const allowedIds = new Set(allowed.map((item) => item.branchid).filter((id) => id !== '0'));
    const custom = filters.customValues || {};
    const source = String(custom['branchId'] || filters.branchId || '');
    const destination = String(custom['toBranchId'] || '');
    return snapshot.docs
      .map((item): Raw => ({ ...item.data(), __key: item.id }))
      .filter((row) => {
        const branch = String(row['branchId'] || '');
        const toBranch = String(row['toBranchId'] || '');
        if (!(canAll || allowedIds.has(branch) || allowedIds.has(toBranch))) return false;
        if (source && source !== branch) return false;
        if (destination && destination !== toBranch) return false;
        for (const key of ['requestType', 'status', 'assignedTo', 'requestedBy', 'approvedBy'])
          if (custom[key] && String(row[key] || '') !== String(custom[key])) return false;
        return true;
      });
  }

  private async workflowAging(filters: ReportFilters): Promise<Row[]> {
    const [requests, branches, users] = await Promise.all([
      this.workflowRows(filters),
      this.branchNames(),
      this.userNames(),
    ]);
    const custom = filters.customValues || {};
    const includeCompleted = String(custom['includeCompleted'] || 'false') === 'true';
    const threshold = Number(custom['ageThreshold'] || 0);
    const closed = new Set(['Approved', 'Rejected', 'Completed', 'Received']);
    const now = Date.now();
    return requests
      .map((request) => {
        const requested = this.asDate(request['requestedOn']);
        const approved = this.asDate(request['approvedOn']);
        const status = String(request['status'] || 'Unknown');
        const age = Math.max(
          0,
          Math.floor(
            ((closed.has(status) && approved ? approved.getTime() : now) - this.time(requested)) /
              86_400_000,
          ),
        );
        const requester = users.get(String(request['requestedBy'] || '')) || 'User unavailable';
        return {
          reference: String(
            request['requestNumber'] ||
              `Request ${this.formatDate(requested)} · ${String(request['requestType'] || 'Workflow')} · ${requester}`,
          ),
          type: String(request['requestType'] || 'Unknown'),
          sourceBranch: branches.get(String(request['branchId'] || '')) || 'Branch unavailable',
          destinationBranch: branches.get(String(request['toBranchId'] || '')) || '—',
          requestedBy: requester,
          requestedOn: requested,
          assignedTo: users.get(String(request['assignedTo'] || '')) || 'Unassigned',
          status,
          approvedBy: users.get(String(request['approvedBy'] || '')) || '—',
          approvedOn: approved,
          ageDays: age,
          remarks: String(request['remarks'] || ''),
        };
      })
      .filter(
        (row) =>
          (includeCompleted || !closed.has(String(row['status']))) &&
          Number(row['ageDays']) >= threshold,
      )
      .sort((a, b) => Number(b['ageDays']) - Number(a['ageDays']));
  }

  private async approverThroughput(filters: ReportFilters): Promise<Row[]> {
    const custom = filters.customValues || {};
    const basis = String(custom['periodBasis'] || 'requested');
    const [requests, users, branchMap] = await Promise.all([
      this.workflowRows(filters, basis === 'approved' ? 'approvedOn' : 'requestedOn'),
      this.userNames(),
      this.branchNames(),
    ]);
    const hierarchy = await getDocs(collection(firestore, 'Users_team_hirearchy'));
    const managers = new Map<string, string>();
    for (const item of hierarchy.docs)
      managers.set(String(item.data()['userid'] || ''), String(item.data()['reportingTo'] || ''));
    const grouped = new Map<string, Row>();
    for (const request of requests) {
      const userId = String(
        custom['approvedBy'] ? request['approvedBy'] || '' : request['assignedTo'] || '',
      );
      const managerId = managers.get(userId) || '';
      const branchId = String(request['branchId'] || request['toBranchId'] || '');
      if (custom['manager'] && managerId !== custom['manager'] && userId !== custom['manager'])
        continue;
      if (custom['branchId'] && branchId !== custom['branchId']) continue;
      if (custom['requestType'] && String(request['requestType']) !== String(custom['requestType']))
        continue;
      if (custom['status'] && String(request['status']) !== String(custom['status'])) continue;
      const key = `${userId}|${branchId}`;
      const row = grouped.get(key) || {
        user: users.get(userId) || (userId ? 'User unavailable' : 'Unassigned'),
        manager: users.get(managerId) || 'No manager assigned',
        branch: branchMap.get(branchId) || 'Branch unavailable',
        requestType: String(request['requestType'] || 'Mixed'),
        assignedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        completedCount: 0,
        averageTurnaround: 0,
        pendingCount: 0,
        __turnaroundTotal: 0,
        __turnaroundCount: 0,
      };
      row['assignedCount'] = Number(row['assignedCount']) + 1;
      const status = String(request['status'] || '');
      if (status === 'Approved') row['approvedCount'] = Number(row['approvedCount']) + 1;
      if (status === 'Rejected') row['rejectedCount'] = Number(row['rejectedCount']) + 1;
      if (status === 'Completed' || status === 'Received')
        row['completedCount'] = Number(row['completedCount']) + 1;
      if (!['Approved', 'Rejected', 'Completed', 'Received'].includes(status))
        row['pendingCount'] = Number(row['pendingCount']) + 1;
      const requested = this.asDate(request['requestedOn']);
      const approved = this.asDate(request['approvedOn']);
      if (
        requested &&
        approved &&
        ['Approved', 'Rejected', 'Completed', 'Received'].includes(status)
      ) {
        row['__turnaroundTotal'] =
          Number(row['__turnaroundTotal']) +
          Math.max(0, (approved.getTime() - requested.getTime()) / 86_400_000);
        row['__turnaroundCount'] = Number(row['__turnaroundCount']) + 1;
      }
      grouped.set(key, row);
    }
    const rows: Row[] = [...grouped.values()].map((row): Row => ({
      ...row,
      averageTurnaround: Number(row['__turnaroundCount'])
        ? Number(row['__turnaroundTotal']) / Number(row['__turnaroundCount'])
        : 0,
    }));
    return rows.sort((a, b) => Number(b['assignedCount']) - Number(a['assignedCount']));
  }

  private async branchComparison(filters: ReportFilters): Promise<Row[]> {
    const [rawOuts, rawIns, overview, transfers, branches, products] = await Promise.all([
      this.stockHeaders(filters, 'out'),
      this.stockHeaders(filters, 'in'),
      this.overview(filters),
      this.transferRows(filters),
      this.branchNames(),
      this.productMap(),
    ]);
    const [outs, ins] = await Promise.all([
      this.filterHeadersByProduct(rawOuts, filters),
      this.filterHeadersByProduct(rawIns, filters),
    ]);
    const custom = filters.customValues || {};
    const status = String(custom['status'] || 'Approved');
    const result = new Map<string, Row>();
    const ensure = (id: string, label: string): Row => {
      if (!result.has(id))
        result.set(id, {
          branch: label,
          sales: 0,
          returns: 0,
          netSales: 0,
          unitsSold: 0,
          stockUnits: 0,
          stockValue: 0,
          lowSkus: 0,
          transferIn: 0,
          transferOut: 0,
          transferInUnits: 0,
          transferOutUnits: 0,
        });
      return result.get(id)!;
    };
    for (const raw of outs.filter(
      (item) => String(item['status']) === status && !!item['customerid'],
    )) {
      const id = String(raw['branchid'] || '');
      const row = ensure(id, String(raw['branchName'] || branches.get(id) || 'Branch unavailable'));
      row['sales'] = Number(row['sales']) + Number(raw['NetTotal'] || 0);
      row['unitsSold'] = Number(row['unitsSold']) + Number(raw['quantity'] || 0);
    }
    for (const raw of ins.filter(
      (item) => String(item['status']) === status && !!item['customerid'],
    )) {
      const id = String(raw['branchid'] || '');
      const row = ensure(id, String(raw['branchName'] || branches.get(id) || 'Branch unavailable'));
      row['returns'] = Number(row['returns']) + Number(raw['NetTotal'] || 0);
    }
    for (const raw of overview) {
      const id = String(raw['branchid'] || '');
      const row = ensure(id, String(raw['branchName'] || branches.get(id) || 'Branch unavailable'));
      const mapped = this.mapOverview(raw, branches, products);
      row['stockUnits'] = Number(row['stockUnits']) + Number(mapped['onHand']);
      row['stockValue'] = Number(row['stockValue']) + Number(mapped['stockValue']);
      if (mapped['alert'] === 'Low' || mapped['alert'] === 'Empty')
        row['lowSkus'] = Number(row['lowSkus']) + 1;
    }
    for (const item of transfers) {
      const from = String(item.row['__fromId'] || '');
      const to = String(item.row['__toId'] || '');
      const units = Number(item.row['requestedUnits'] || 0);
      if (result.has(from) || branches.has(from)) {
        const row = ensure(from, branches.get(from) || 'Branch unavailable');
        row['transferOut'] = Number(row['transferOut']) + 1;
        row['transferOutUnits'] = Number(row['transferOutUnits']) + units;
      }
      if (result.has(to) || branches.has(to)) {
        const row = ensure(to, branches.get(to) || 'Branch unavailable');
        row['transferIn'] = Number(row['transferIn']) + 1;
        row['transferInUnits'] = Number(row['transferInUnits']) + units;
      }
    }
    const permitted = this.auth.currentSession()?.branches || [];
    const selectedBranch = filters.branchId || String(custom['branchId'] || '');
    if (selectedBranch)
      ensure(selectedBranch, branches.get(selectedBranch) || 'Branch unavailable');
    else if (permitted.some((item) => item.branchid === '0'))
      for (const [id, name] of branches) ensure(id, name);
    else for (const item of permitted) if (item.branchid) ensure(item.branchid, item.name);
    for (const row of result.values())
      row['netSales'] = Number(row['sales']) - Number(row['returns']);
    return [...result.values()].sort((a, b) => Number(b['netSales']) - Number(a['netSales']));
  }

  private async aggregates(id: string, rows: Row[]): Promise<ReportAggregate[]> {
    const sum = (field: string) => rows.reduce((total, row) => total + Number(row[field] || 0), 0);
    const card = (
      key: string,
      label: string,
      value: number,
      format: 'number' | 'currency' = 'number',
    ): ReportAggregate => ({ key, label, value, format });
    if (id === 'inventory-on-hand')
      return [
        card('skus', 'SKU / branch rows', new Set(rows.map((r) => r['__branchProductKey'])).size),
        card('units', 'Total units', sum('onHand')),
        card('reserved', 'Total reserved', sum('reserved')),
        card('available', 'Total available', sum('available')),
        card('value', 'Estimated on-hand retail value', sum('stockValue'), 'currency'),
      ];
    if (id === 'sales-summary')
      return [
        card('documents', 'Sales documents', rows.length),
        card('units', 'Units sold', sum('units')),
        card('subtotal', 'Gross subtotal', sum('subtotal'), 'currency'),
        card('discount', 'Discounts', sum('discount'), 'currency'),
        card('sales', 'Net sales', sum('netTotal'), 'currency'),
      ];
    if (id === 'low-stock')
      return [
        card('empty', 'Empty SKUs', rows.filter((r) => r['alert'] === 'Empty').length),
        card('low', 'Low SKUs', rows.filter((r) => r['alert'] === 'Low').length),
        card('units', 'Units needed to threshold', sum('needed')),
        card(
          'replenishment',
          'Estimated replenishment value',
          sum('replenishmentValue'),
          'currency',
        ),
      ];
    if (id === 'dead-slow-stock')
      return [
        card('skus', 'Slow / dead SKUs', rows.length),
        card('units', 'Units affected', sum('available')),
        card('replenishment', 'Estimated tied-up value', sum('tiedValue'), 'currency'),
      ];
    if (id === 'inventory-valuation')
      return [
        card('units', 'Units valued', sum('valuationUnits')),
        card('value', 'Estimated retail value', sum('extendedValue'), 'currency'),
        ...this.groupTotals(rows, 'branch', 'extendedValue', 'Branch value'),
        ...this.groupTotals(rows, 'brand', 'extendedValue', 'Brand value'),
      ];
    if (id === 'stock-movement') {
      const documents = new Map<string, Row>();
      for (const row of rows) documents.set(String(row['transactionKey']), row);
      const inRows = rows.filter((row) => row['direction'] === 'in');
      const outRows = rows.filter((row) => row['direction'] === 'out');
      return [
        card(
          'inUnits',
          'Inbound units',
          inRows.reduce((t, r) => t + Number(r['quantity']), 0),
        ),
        card(
          'outUnits',
          'Outbound units',
          outRows.reduce((t, r) => t + Number(r['quantity']), 0),
        ),
        card(
          'net',
          'Net units',
          inRows.reduce((t, r) => t + Number(r['quantity']), 0) -
            outRows.reduce((t, r) => t + Number(r['quantity']), 0),
        ),
        card(
          'inValue',
          'Inbound value',
          inRows.reduce((t, r) => t + Number(r['documentNet'] || 0), 0),
          'currency',
        ),
        card(
          'outValue',
          'Outbound value',
          outRows.reduce((t, r) => t + Number(r['documentNet'] || 0), 0),
          'currency',
        ),
        card('transactions', 'Transactions', documents.size),
      ];
    }
    if (id === 'sales-by-product')
      return [
        card('units', 'Total units', sum('units')),
        card('sales', 'Total net sales', sum('netSales'), 'currency'),
        card('groups', 'Product / brand count', rows.length),
        ...(rows[0]
          ? [
              card(
                'top',
                `Top ${rows[0]['group']?.toString().toLowerCase() || 'product'}: ${rows[0]['product']}`,
                Number(rows[0]['netSales']),
                'currency',
              ),
            ]
          : []),
      ];
    if (id === 'customer-sales-returns') {
      const sales = rows.filter((row) => row['transactionType'] === 'Sale');
      const returns = rows.filter((row) => row['transactionType'] === 'Return');
      const sold = sales.reduce((t, r) => t + Math.abs(Number(r['units'])), 0);
      const returned = returns.reduce((t, r) => t + Math.abs(Number(r['units'])), 0);
      return [
        card(
          'sales',
          'Sales amount',
          sales.reduce((t, r) => t + Number(r['net']), 0),
          'currency',
        ),
        card(
          'returns',
          'Return amount',
          Math.abs(returns.reduce((t, r) => t + Number(r['net']), 0)),
          'currency',
        ),
        card('net', 'Net sales', sum('net'), 'currency'),
        card('sold', 'Units sold', sold),
        card('returned', 'Units returned', returned),
        card('rate', 'Return rate by units', sold ? (returned / sold) * 100 : 0, 'number'),
      ];
    }
    if (id === 'discount-impact')
      return [
        card('gross', 'Gross subtotal', sum('subtotal'), 'currency'),
        card('discount', 'Applied discounts', sum('discount'), 'currency'),
        card('net', 'Net total', sum('netTotal'), 'currency'),
        card(
          'rate',
          'Effective discount rate (%)',
          sum('subtotal') ? (sum('discount') / sum('subtotal')) * 100 : 0,
        ),
      ];
    if (id === 'vendor-purchase-summary') {
      const docs = new Map<string, Row>();
      for (const row of rows) docs.set(String(row['documentKey']), row);
      return [
        card('docs', 'Purchase documents', docs.size),
        card('units', 'Units received', sum('units')),
        card('subtotal', 'Subtotal', sum('subtotal'), 'currency'),
        card('discount', 'Discounts', sum('discount'), 'currency'),
        card('net', 'Net purchasing value', sum('netTotal'), 'currency'),
        ...this.groupTotals(rows, 'vendor', 'netTotal', 'Vendor spend'),
      ];
    }
    if (id === 'transfer-fill-rate') {
      const requested = sum('requested');
      const received = sum('received');
      return [
        card('requested', 'Requested units', requested),
        card('shipped', 'Shipped units', sum('shipped')),
        card('received', 'Received units', received),
        card('fill', 'Fill rate', requested ? (received / requested) * 100 : 0),
        card(
          'shortage',
          'Transfers with shortages',
          new Set(rows.filter((row) => row['__shortage']).map((r) => r['reference'])).size,
        ),
      ];
    }
    if (id === 'transfer-performance') {
      const completed = rows.filter(
        (r) => ['Completed', 'Received'].includes(String(r['status'])) && r['__completionDate'],
      );
      const onTimeEligible = completed.filter((r) => r['expected']);
      return [
        card('count', 'Transfers', rows.length),
        ...this.groupCounts(rows, 'status', 'Transfers by status'),
        card(
          'units',
          'Units transferred',
          completed.reduce((t, r) => t + Number(r['receivedUnits'] || 0), 0),
        ),
        card(
          'overdue',
          'Overdue transfers',
          rows.filter(
            (r) =>
              !['Completed', 'Received'].includes(String(r['status'])) &&
              this.time(r['expected']) > 0 &&
              this.time(r['expected']) < Date.now(),
          ).length,
        ),
        card(
          'average',
          'Average completion days',
          completed.length
            ? completed.reduce((t, r) => t + Number(r['daysOpen']), 0) / completed.length
            : 0,
        ),
        card(
          'onTime',
          'On-time completion rate (%)',
          onTimeEligible.length
            ? (onTimeEligible.filter((r) => r['__onTime']).length / onTimeEligible.length) * 100
            : 0,
        ),
      ];
    }
    if (id === 'workflow-aging')
      return [
        card(
          'open',
          'Open requests',
          rows.filter(
            (r) => !['Approved', 'Rejected', 'Completed', 'Received'].includes(String(r['status'])),
          ).length,
        ),
        card('overdue', 'Over threshold', rows.length),
        card('average', 'Average age (days)', rows.length ? sum('ageDays') / rows.length : 0),
        card(
          'maximum',
          'Maximum age (days)',
          Math.max(0, ...rows.map((r) => Number(r['ageDays'] || 0))),
        ),
        ...this.groupCounts(rows, 'status', 'Requests by status'),
        ...this.groupCounts(rows, 'type', 'Requests by type'),
      ];
    if (id === 'branch-comparison')
      return [
        card('sales', 'Network period sales', sum('sales'), 'currency'),
        card('returns', 'Network period returns', sum('returns'), 'currency'),
        card('net', 'Network net sales', sum('netSales'), 'currency'),
        card('units', 'Current stock units', sum('stockUnits')),
        card('value', 'Current estimated retail value', sum('stockValue'), 'currency'),
        ...(rows[0]
          ? [
              {
                key: 'topBranch',
                label: 'Highest net sales branch',
                value: String(rows[0]['branch']),
              },
            ]
          : []),
      ];
    if (id === 'approver-throughput')
      return [
        card('handled', 'Total requests handled', sum('assignedCount')),
        card(
          'turnaround',
          'Average turnaround (days)',
          rows.length
            ? rows.reduce(
                (t, r) => t + Number(r['averageTurnaround']) * Number(r['approvedCount'] || 0),
                0,
              ) / Math.max(1, sum('approvedCount'))
            : 0,
        ),
        card('pending', 'Pending workload', sum('pendingCount')),
        card(
          'completion',
          'Completion rate (%)',
          sum('assignedCount') ? (sum('completedCount') / sum('assignedCount')) * 100 : 0,
        ),
      ];
    return [];
  }

  private groupTotals(
    rows: Row[],
    group: string,
    value: string,
    prefix: string,
  ): ReportAggregate[] {
    const groups = new Map<string, number>();
    for (const row of rows) {
      const key = String(row[group] || 'Not recorded');
      groups.set(key, (groups.get(key) || 0) + Number(row[value] || 0));
    }
    return [...groups.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount], index) => ({
        key: `${prefix}-${index}`,
        label: `${prefix}: ${name}`,
        value: amount,
        format:
          value.toLowerCase().includes('value') || value.toLowerCase().includes('sales')
            ? 'currency'
            : 'number',
      }));
  }
  private groupCounts(rows: Row[], group: string, prefix: string): ReportAggregate[] {
    const groups = new Map<string, number>();
    for (const row of rows) {
      const key = String(row[group] || 'Not recorded');
      groups.set(key, (groups.get(key) || 0) + 1);
    }
    return [...groups.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], index) => ({
        key: `${prefix}-${index}`,
        label: `${prefix}: ${name}`,
        value: count,
        format: 'number',
      }));
  }

  private inRange(
    value: Date | null,
    from?: string | Date | null,
    to?: string | Date | null,
  ): boolean {
    if (!value) return !from && !to;
    return (!from || value >= this.dayStart(from)) && (!to || value <= this.dayEnd(to));
  }
  private dayStart(value: string | Date): Date {
    const date =
      value instanceof Date ? new Date(value) : new Date(`${String(value).slice(0, 10)}T00:00:00`);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  private dayEnd(value: string | Date): Date {
    const date =
      value instanceof Date
        ? new Date(value)
        : new Date(`${String(value).slice(0, 10)}T23:59:59.999`);
    date.setHours(23, 59, 59, 999);
    return date;
  }
  private asDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  private time(value: unknown): number {
    return this.asDate(value)?.getTime() || 0;
  }
  private formatDate(value: unknown): string {
    const date = this.asDate(value);
    return date ? date.toLocaleDateString() : 'Not recorded';
  }
  private reference(raw?: Raw): string {
    return String(
      raw?.['referenceNumber'] ||
        raw?.['transactionNumber'] ||
        raw?.['invoiceNumber'] ||
        raw?.['reference'] ||
        'Not recorded',
    );
  }
  private documentDiscountAmount(raw: Raw): number {
    const discount = Number(raw['discountvalue'] || 0);
    return String(raw['discounttype'] || '').toLowerCase() === 'percentage'
      ? (Number(raw['subtotal'] || 0) * discount) / 100
      : discount;
  }
}
