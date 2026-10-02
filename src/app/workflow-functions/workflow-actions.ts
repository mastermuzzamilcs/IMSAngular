import { Injectable } from '@angular/core';
import { SalesAcceptFunction } from './sales-accept.function';
import { SalesApproveFunction } from './sales-approve.function';
import { SalesCancelFunction } from './sales-cancel.function';
import { SalesRejectFunction } from './sales-reject.function';
import { SalesReserveFunction } from './sales-reserve.function';
import { SalesReturnAcceptFunction } from './sales-return-accept.function';
import { SalesReturnApproveFunction } from './sales-return-approve.function';
import { SalesReturnCancelFunction } from './sales-return-cancel.function';
import { SalesReturnRejectFunction } from './sales-return-reject.function';
import { SalesReturnReserveFunction } from './sales-return-reserve.function';
import { StockInAcceptFunction } from './stock-in-accept.function';
import { StockInApproveFunction } from './stock-in-approve.function';
import { StockInCancelFunction } from './stock-in-cancel.function';
import { StockInRejectFunction } from './stock-in-reject.function';
import { StockInReserveFunction } from './stock-in-reserve.function';
import { StockOutAcceptFunction } from './stock-out-accept.function';
import { StockOutApproveFunction } from './stock-out-approve.function';
import { StockOutCancelFunction } from './stock-out-cancel.function';
import { StockOutRejectFunction } from './stock-out-reject.function';
import { StockOutReserveFunction } from './stock-out-reserve.function';
import { TransferArriveFunction } from './transfer-arrive.function';
import { TransferCourierReturnFunction } from './transfer-courier-return.function';
import { TransferDispatchFunction } from './transfer-dispatch.function';
import { TransferOpenStockOutFunction } from './transfer-open-stock-out.function';
import { TransferReceiveFunction } from './transfer-receive.function';
import { TransferRejectFunction } from './transfer-reject.function';
import { TransferUpdateStatusFunction } from './transfer-update-status.function';

@Injectable({ providedIn: 'root' })
export class WorkflowActionBootstrap {
  constructor(
    _stockInReserve: StockInReserveFunction,
    _stockInAccept: StockInAcceptFunction,
    _stockInCancel: StockInCancelFunction,
    _stockInApprove: StockInApproveFunction,
    _stockInReject: StockInRejectFunction,
    _stockOutReserve: StockOutReserveFunction,
    _stockOutAccept: StockOutAcceptFunction,
    _stockOutCancel: StockOutCancelFunction,
    _stockOutApprove: StockOutApproveFunction,
    _stockOutReject: StockOutRejectFunction,
    _salesReserve: SalesReserveFunction,
    _salesAccept: SalesAcceptFunction,
    _salesCancel: SalesCancelFunction,
    _salesApprove: SalesApproveFunction,
    _salesReject: SalesRejectFunction,
    _salesReturnReserve: SalesReturnReserveFunction,
    _salesReturnAccept: SalesReturnAcceptFunction,
    _salesReturnCancel: SalesReturnCancelFunction,
    _salesReturnApprove: SalesReturnApproveFunction,
    _salesReturnReject: SalesReturnRejectFunction,
    _transferUpdateStatus: TransferUpdateStatusFunction,
    _transferOpenStockOut: TransferOpenStockOutFunction,
    _transferDispatch: TransferDispatchFunction,
    _transferArrive: TransferArriveFunction,
    _transferReceive: TransferReceiveFunction,
    _transferReject: TransferRejectFunction,
    _transferCourierReturn: TransferCourierReturnFunction,
  ) {}
}
