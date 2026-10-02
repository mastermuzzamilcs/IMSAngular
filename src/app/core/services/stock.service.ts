import { Injectable } from '@angular/core';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  getDoc,
  where,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { Stock, StockDetails, StockOverview } from '../Models/StockModel';
import { BranchService } from './branchservice.service';
import { VendorService } from './vendor.service';
import { ProductService } from './product.service';
import { BrandService } from './brand.service';

function toJsDate(raw: any): Date {
  if (!raw) return new Date();
  if (raw instanceof Date) return raw;
  if (raw instanceof Timestamp) return raw.toDate();
  return new Date(String(raw));
}

@Injectable({ providedIn: 'root' })
export class StockService {
  constructor(
    private _brandService: BrandService,
    private _branchService: BranchService,
    private _vendorService: VendorService,
    private _productService: ProductService,
  ) {}
  private readonly topicName: string = 'inventory_stocks';
  private readonly DetailstopicName: string = 'inventory_stocks_details';
  private readonly OverviewtopicName: string = 'inventory_stock_overview';
  private cachedStocks: Stock[] | null = null;

  private cachedOverview: Map<string, StockOverview[]> = new Map();

  async getAll(forceRefresh: boolean = false): Promise<Stock[]> {
    if (this.cachedStocks && !forceRefresh) {
      return this.cachedStocks;
    }
    const querySnapshot = await getDocs(collection(firestore, this.topicName));
    this.cachedStocks = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        stockid: doc.id,
        branchid: data['branchid'] || '',
        branchName: data['branchName'] || '',
        vendorid: data['vendorid'] || '',
        vendorName: data['vendorName'] || '',
        quantity: data['quantity'] || 0,
        subtotal: data['subtotal'] || 0,
        discounttype: data['discounttype'] || '',
        discountvalue: data['discountvalue'] || 0,
        lastUpdated: toJsDate(data['lastUpdated']) || '',
        entrydate: toJsDate(data['entrydate']) || '',
        NetTotal: data['NetTotal'] || 0,
        status: data['status'] || '',
        stocktype: data['stocktype'] || '',
      };
    });
    return this.cachedStocks;
  }

  async addStock(_stock: Stock): Promise<any> {
    const branchRef = collection(firestore, this.topicName);
    const resDocRef = await addDoc(branchRef, _stock);
    this.cachedStocks = null;
    return resDocRef.id;
  }
  async addStockDetails(_stockDetails: StockDetails): Promise<void> {
    const branchRef = collection(firestore, this.DetailstopicName);
    await addDoc(branchRef, _stockDetails);
    this.cachedStocks = null;
  }
  async addStockEntity(_payload: any): Promise<string> {
    const stockid = await this.addStock(this.populateStockMain(_payload));
    const details = this.populateStockDetails(stockid, _payload.stockItems);
    await Promise.all(details.map((d) => this.addStockDetails(d)));
    this.cachedStocks = null;
    return stockid;
  }

  populateStockMain(_payload: any): Stock {
    const _stock: Stock = {
      branchid: _payload['branch'] || '',
      vendorid: _payload['vendor'] || '',
      entrydate: _payload['date'] ? new Date(_payload['date']) : new Date(),
      lastUpdated: _payload['lastUpdated'] ? new Date(_payload['lastUpdated']) : new Date(),
      quantity: _payload['TotalItems'] || 0,
      discounttype: _payload['DiscountType'] || '',
      discountvalue: _payload['DiscountValue'] || 0,
      subtotal: _payload['SubTotal'] || 0,
      NetTotal: _payload['NetTotal'] || 0,
      status: _payload['status'] || '',
      stocktype: _payload['stocktype'] || '',
      ...(_payload['remarks'] ? { remarks: _payload['remarks'] } : {}),
    };

    return _stock;
  }

  populateStockDetails(_stockid: string, payload: any): StockDetails[] {
    const stockDetails: StockDetails[] = [];

    if (payload && Array.isArray(payload)) {
      for (const item of payload) {
        const detail: StockDetails = {
          stockid: _stockid,
          productid: item.id || '',
          quantity: Number(item.quantity) || 0,
          unitprice: Number(item.unitPrice) || 0,
          discount: Number(item.discount) || 0,
          total: Number(item.total) || 0,
          reason: item.reason || '',
          comments: item.comments || '',
        };

        stockDetails.push(detail);
      }
    }

    return stockDetails;
  }

  async updateStock(_stock: Stock): Promise<void> {
    if (!_stock.stockid) {
      console.error('Branch ID is required for updating the branch.');
      return;
    }

    const branchRef = doc(firestore, this.topicName, _stock.stockid);
    await setDoc(branchRef, _stock);
    this.cachedStocks = null;
  }

  async deleteStock(_stockId: string): Promise<void> {
    const branchRef = doc(firestore, this.topicName, _stockId);
    await deleteDoc(branchRef);
    this.cachedStocks = null;
  }

  async getStockById(_stockId: string): Promise<Stock | null> {
    const docRef = doc(firestore, this.topicName, _stockId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const [branch, vendor] = await Promise.all([
        this._branchService.getBranchById(data['branchid']),
        this._vendorService.getVendorById(data['vendorid']),
      ]);
      return {
        stockid: docSnap.id,
        branchid: data['branchid'] || '',
        branchName: branch?.name || '',
        vendorid: data['vendorid'] || '',
        vendorName: vendor?.name || '',
        quantity: data['quantity'] || 0,
        subtotal: data['subtotal'] || 0,
        discounttype: data['discounttype'] || '',
        discountvalue: data['discountvalue'] || 0,
        lastUpdated: toJsDate(data['lastUpdated']) || '',
        entrydate: toJsDate(data['entrydate']) || '',
        NetTotal: data['NetTotal'] || 0,
        status: data['status'] || '',
      } as Stock;
    } else {
      return null;
    }
  }
  async getStockByBranch(branchid: string): Promise<Stock[]> {
    const q = query(collection(firestore, this.topicName), where('branchid', '==', branchid));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        stockid: doc.id,
        ...data,
        entrydate: toJsDate(data['entrydate']),
        lastUpdated: toJsDate(data['lastUpdated']),
      } as Stock;
    });
  }
  /** Returns ALL detail rows belonging to a single stock record */
  async getStockDetails(stockid: string): Promise<StockDetails[]> {
    const q = query(collection(firestore, this.DetailstopicName), where('stockid', '==', stockid));

    const snap = await getDocs(q);
    const detailPromises = snap.docs.map(async (d) => {
      const data = d.data();
      const prod = await this._productService.getProductById(data['productid']);
      return {
        stockdetailsid: d.id,
        stockid: data['stockid'],
        productid: data['productid'],
        productName: prod?.name ?? '',
        quantity: data['quantity'],
        unitprice: data['unitprice'],
        discount: data['discount'],
        total: data['total'],
      } as StockDetails;
    });
    return Promise.all(detailPromises);
  }

  /**
   * Convenience call that returns the header (Stock) together
   * with its detail rows as a single object.
   *
   * @returns Stock merged with a `details` property
   *          →  `Stock & { details: StockDetails[] }`
   */
  async getStockEntityById(stockid: string): Promise<(Stock & { details: StockDetails[] }) | null> {
    const header = await this.getStockById(stockid);
    if (!header) return null;

    const details = await this.getStockDetails(stockid);
    return { ...header, details };
  }

  async MarkRequestDetails(_stockid: string, _branchid: string, _status: string): Promise<void> {
    if (!_stockid || !_status) {
      throw new Error('Missing stockid or status');
    }

    try {
      const stockDocRef = doc(firestore, this.topicName, _stockid);
      await updateDoc(stockDocRef, { status: _status });
      console.log(`Stock #${_stockid} marked as ${_status}`);
    } catch (error) {
      console.error('Error updating stock status:', error);
      throw error;
    }
  }
  // async getStockOverviewByBranch(branchid: string, forceRefresh = false): Promise<StockOverview[]> {
  //   const q = query(
  //     collection(firestore, this.topicName),
  //     where('branchid', '==', branchid),
  //     where('status', '==', 'Approved')
  //   );
  //   const stockSnap = await getDocs(q);
  //   const stocks = stockSnap.docs.map(d => ({ stockid: d.id, ...d.data() } as Stock));

  //   const overviewItems: StockOverview[] = [];

  //   const allDetails = await Promise.all(
  //     stocks.map(s => this.getStockDetails(s.stockid ?? ''))
  //   );

  //   const productIds = new Set<string>();
  //   allDetails.flat().forEach(d => productIds.add(d.productid));

  //   const products = await this._productService.getProductsByIds([...productIds]);
  //   const productMap = new Map(products.map(p => [p.id, p]));

  //   const brandIds = new Set<string>();
  //   products.forEach(p => brandIds.add(p.brandId));
  //   const brands = await this._brandService.getBrandsByIds([...brandIds]);
  //   const brandMap = new Map(brands.map(b => [b.id, b]));

  //   const branch = await this._branchService.getBranchById(branchid);

  //   for (let i = 0; i < stocks.length; i++) {
  //     const stock = stocks[i];
  //     const details = allDetails[i];

  //     for (const d of details) {
  //       const product = productMap.get(d.productid);
  //       const brand = brandMap.get(product?.brandId ?? '');

  //       overviewItems.push({
  //         stockid: stock.stockid ?? '',
  //         branchid: stock.branchid,
  //         branchName: branch?.name ?? '',
  //         productid: d.productid,
  //         productName: product?.name ?? '',
  //         brandid: product?.brandId ?? '',
  //         brandName: brand?.name ?? '',
  //         quantity: stock.stocktype === 'out' ? -1 * d.quantity : d.quantity,
  //         price: product?.price ?? 0,
  //         description: product?.description ?? '',
  //         alert: undefined
  //       });
  //     }
  //   }

  //   // Group by productid and aggregate quantities
  //   const grouped: { [productid: string]: StockOverview } = {};
  //   for (const item of overviewItems) {
  //     if (!grouped[item.productid]) {
  //       grouped[item.productid] = { ...item };
  //     } else {
  //       grouped[item.productid].quantity += item.quantity;
  //     }
  //   }

  //   return Object.values(grouped);
  // }
  async getStockOverviewByBranch(branchid: string, forceRefresh = false): Promise<StockOverview[]> {
    if (!forceRefresh && this.cachedOverview.has(branchid)) {
      return this.cachedOverview.get(branchid)!;
    }

    const q = query(
      collection(firestore, this.OverviewtopicName),
      where('branchid', '==', branchid),
    );
    const snapshot = await getDocs(q);

    const overview = snapshot.docs.map((doc) => ({
      ...doc.data(),
      stockid: doc.id,
    })) as StockOverview[];

    if (overview.length > 0) {
      this.cachedOverview.set(branchid, overview);
    }
    return overview;
  }
  async calculateOverviewForBranch(branchid: string): Promise<StockOverview[]> {
    const q = query(
      collection(firestore, this.topicName),
      where('branchid', '==', branchid),
      where('status', '==', 'Approved'),
    );
    const stockSnap = await getDocs(q);
    const stocks = stockSnap.docs.map((d) => ({ stockid: d.id, ...d.data() }) as Stock);

    const overviewItems: StockOverview[] = [];

    const allDetails = await Promise.all(stocks.map((s) => this.getStockDetails(s.stockid ?? '')));

    const productIds = new Set<string>();
    allDetails.flat().forEach((d) => productIds.add(d.productid));

    const products = await this._productService.getProductsByIds([...productIds]);
    const productMap = new Map(products.map((p) => [p.id, p]));

    const brandIds = new Set<string>();
    products.forEach((p) => brandIds.add(p.brandId));
    const brands = await this._brandService.getBrandsByIds([...brandIds]);
    const brandMap = new Map(brands.map((b) => [b.id, b]));

    const branch = await this._branchService.getBranchById(branchid);

    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      const details = allDetails[i];
      for (const d of details) {
        const product = productMap.get(d.productid);
        const brand = brandMap.get(product?.brandId ?? '');

        overviewItems.push({
          stockid: stock.stockid ?? '',
          branchid: stock.branchid,
          branchName: branch?.name ?? '',
          productid: d.productid,
          productName: product?.name ?? '',
          brandid: product?.brandId ?? '',
          brandName: brand?.name ?? '',
          quantity: stock.stocktype === 'out' ? -1 * d.quantity : d.quantity,
          price: product?.price ?? 0,
          description: product?.description ?? '',
          alert: undefined,
        });
      }
    }

    const grouped: { [productid: string]: StockOverview } = {};
    for (const item of overviewItems) {
      if (!grouped[item.productid]) {
        grouped[item.productid] = { ...item };
      } else {
        grouped[item.productid].quantity += item.quantity;
      }
    }

    return Object.values(grouped);
  }
  async updateStockOverviewCache(
    branchid: string,
    reservedOverride?: Map<string, number>,
  ): Promise<void> {
    const calculated = await this.calculateOverviewForBranch(branchid);
    const overviewCollection = collection(firestore, this.OverviewtopicName);
    const q = query(overviewCollection, where('branchid', '==', branchid));
    const snap = await getDocs(q);
    const reservedByProduct =
      reservedOverride ??
      new Map<string, number>(
        snap.docs.map((overviewDoc) => {
          const data = overviewDoc.data();
          return [data['productid'], Number(data['reservedQuantity']) || 0];
        }),
      );
    const balanceByProduct = new Map<string, number>(
      snap.docs.map((overviewDoc) => {
        const data = overviewDoc.data();
        const stored = data['balanceQuantity'];
        return [
          data['productid'],
          stored === undefined || stored === null
            ? Number(data['quantity']) || 0
            : Number(stored) || 0,
        ];
      }),
    );

    await Promise.all(snap.docs.map((overviewDoc) => deleteDoc(overviewDoc.ref)));

    const additions = calculated.map((item) => {
      const { alert, ...rest } = item;
      const reservedQuantity = reservedByProduct.get(item.productid) || 0;
      const balanceQuantity = balanceByProduct.has(item.productid)
        ? balanceByProduct.get(item.productid) || 0
        : item.quantity;
      return addDoc(overviewCollection, {
        ...rest,
        reservedQuantity,
        balanceQuantity,
        ...(alert !== undefined && { alert }),
        lastUpdated: new Date(),
      });
    });
    await Promise.all(additions);
    this.cachedOverview.delete(branchid);
  }

  private collapseLines(
    items: { productId: string; quantity: number }[],
  ): { productId: string; quantity: number }[] {
    const totals = new Map<string, number>();
    items.forEach((item) => {
      const quantity = Number(item.quantity) || 0;
      totals.set(item.productId, (totals.get(item.productId) || 0) + quantity);
    });
    return Array.from(totals.entries()).map(([productId, quantity]) => ({ productId, quantity }));
  }

  async holdInbound(
    branchId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    await this.adjustQuantities(branchId, items, true, (row) => ({
      reservedQuantity: this.reserved(row) + this.lineQuantity(row),
      balanceQuantity: this.balance(row),
    }));
  }

  async acceptInbound(
    branchId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    await this.adjustQuantities(branchId, items, true, (row) => ({
      reservedQuantity: Math.max(0, this.reserved(row) - this.lineQuantity(row)),
      balanceQuantity: this.balance(row) + this.lineQuantity(row),
      quantity: this.ledger(row) + this.lineQuantity(row),
    }));
  }

  async cancelInbound(
    branchId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    await this.adjustQuantities(branchId, items, true, (row) => ({
      reservedQuantity: Math.max(0, this.reserved(row) - this.lineQuantity(row)),
      balanceQuantity: this.balance(row),
    }));
  }

  async holdOutbound(
    branchId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    await this.adjustQuantities(branchId, items, false, (row) => {
      const quantity = this.lineQuantity(row);
      const balance = this.balance(row);
      if (quantity > balance) {
        throw new Error('Quantity is greater than the balance quantity');
      }
      return {
        reservedQuantity: this.reserved(row) + quantity,
        balanceQuantity: balance - quantity,
      };
    });
  }

  async acceptOutbound(
    branchId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    await this.adjustQuantities(branchId, items, false, (row) => ({
      reservedQuantity: Math.max(0, this.reserved(row) - this.lineQuantity(row)),
      balanceQuantity: this.balance(row),
      quantity: this.ledger(row) - this.lineQuantity(row),
    }));
  }

  async cancelOutbound(
    branchId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    await this.adjustQuantities(branchId, items, false, (row) => ({
      reservedQuantity: Math.max(0, this.reserved(row) - this.lineQuantity(row)),
      balanceQuantity: this.balance(row) + this.lineQuantity(row),
    }));
  }

  async restoreApprovedOutbound(
    branchId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    await this.adjustQuantities(branchId, items, false, (row) => ({
      reservedQuantity: this.reserved(row),
      balanceQuantity: this.balance(row) + this.lineQuantity(row),
      quantity: this.ledger(row) + this.lineQuantity(row),
    }));
  }

  private lineQuantity(row: StockOverview & { movementQuantity?: number }): number {
    return Number(row.movementQuantity) || 0;
  }

  private reserved(row: StockOverview): number {
    return Number(row.reservedQuantity) || 0;
  }

  private balance(row: StockOverview): number {
    return Number(row.balanceQuantity ?? row.quantity) || 0;
  }

  private ledger(row: StockOverview): number {
    return Number(row.quantity) || 0;
  }

  private async adjustQuantities(
    branchId: string,
    items: { productId: string; quantity: number }[],
    createMissing: boolean,
    change: (row: StockOverview & { movementQuantity: number }) => {
      reservedQuantity: number;
      balanceQuantity: number;
      quantity?: number;
    },
  ): Promise<void> {
    for (const line of this.collapseLines(items)) {
      const row = await this.overviewRow(branchId, line.productId, createMissing);
      const next = change({ ...row, movementQuantity: line.quantity });
      await updateDoc(doc(firestore, this.OverviewtopicName, row.stockid), {
        reservedQuantity: next.reservedQuantity,
        balanceQuantity: next.balanceQuantity,
        ...(next.quantity !== undefined ? { quantity: next.quantity } : {}),
        lastUpdated: new Date(),
      });
      this.cachedOverview.delete(branchId);
    }
  }

  private async overviewRow(
    branchId: string,
    productId: string,
    createMissing: boolean,
  ): Promise<StockOverview> {
    const overview = await this.getStockOverviewByBranch(branchId, true);
    const existing = overview.find((item) => item.productid === productId);
    if (existing?.stockid) {
      return existing;
    }
    if (!createMissing) {
      throw new Error('Stock was not found for a selected product');
    }

    const product = await this._productService.getProductById(productId);
    const brand = product?.brandId ? await this._brandService.getBrandById(product.brandId) : null;
    const branch = await this._branchService.getBranchById(branchId);
    const created = await addDoc(collection(firestore, this.OverviewtopicName), {
      branchid: branchId,
      branchName: branch?.name ?? '',
      productid: productId,
      productName: product?.name ?? '',
      brandid: product?.brandId ?? '',
      brandName: brand?.name ?? '',
      quantity: 0,
      balanceQuantity: 0,
      reservedQuantity: 0,
      price: product?.price ?? 0,
      description: product?.description ?? '',
      lastUpdated: new Date(),
    });
    this.cachedOverview.delete(branchId);
    return {
      stockid: created.id,
      branchid: branchId,
      branchName: branch?.name ?? '',
      productid: productId,
      productName: product?.name ?? '',
      brandid: product?.brandId ?? '',
      brandName: brand?.name ?? '',
      quantity: 0,
      balanceQuantity: 0,
      reservedQuantity: 0,
      price: product?.price ?? 0,
      description: product?.description ?? '',
    };
  }
}
