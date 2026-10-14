import { Status } from '../enums/status.enum';

export interface Stock {
  stockid?: string;
  branchid: string;
  branchName?: string;
  vendorid: string;
  vendorName?: string;
  quantity: number;
  subtotal: number;
  discounttype: string;
  discountvalue: number;
  NetTotal: number;
  lastUpdated?: Date;
  entrydate?: Date;
  status: Status;
  stocktype: string;
  remarks?: string;
  customerid?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
}

export interface StockDetails {
  stockdetailsid?: string;
  stockid: string;
  productid: string;
  productName?: string;
  quantity: number;
  unitprice: number;
  discount: number;
  total: number;
  reason?: string;
  comments?: string;
}

export interface StockOverview {
  stockid: string;
  branchid: string;
  branchName: string;
  productid: string;
  productName: string;
  brandid: string;
  brandName: string;
  quantity: number;
  balanceQuantity?: number;
  reservedQuantity?: number;
  price: number;
  description: string;
  alert?: 'Empty' | 'Low' | 'Healthy';
  lastUpdated?: Date;
}
