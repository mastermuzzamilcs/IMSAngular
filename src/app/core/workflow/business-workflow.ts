import { RequestStatus, RequestType } from '../Models/WorkflowModel';
import { WorkflowFunctionRecord } from '../Models/WorkflowFunctionRecord';
import { WorkflowFunctionLink } from '../Models/WorkflowFunctionLink';

export const businessFunctions: WorkflowFunctionRecord[] = [
  { code: 'StockIn.reserve', name: 'Reserve stock in', className: 'StockInReserveFunction' },
  { code: 'StockIn.accept', name: 'Accept stock in', className: 'StockInAcceptFunction' },
  { code: 'StockIn.cancel', name: 'Cancel stock in', className: 'StockInCancelFunction' },
  { code: 'StockIn.approve', name: 'Approve stock in', className: 'StockInApproveFunction' },
  { code: 'StockIn.reject', name: 'Reject stock in', className: 'StockInRejectFunction' },
  { code: 'StockOut.reserve', name: 'Reserve stock out', className: 'StockOutReserveFunction' },
  { code: 'StockOut.accept', name: 'Accept stock out', className: 'StockOutAcceptFunction' },
  { code: 'StockOut.cancel', name: 'Cancel stock out', className: 'StockOutCancelFunction' },
  { code: 'StockOut.approve', name: 'Approve stock out', className: 'StockOutApproveFunction' },
  { code: 'StockOut.reject', name: 'Reject stock out', className: 'StockOutRejectFunction' },
  { code: 'Sales.reserve', name: 'Reserve sale', className: 'SalesReserveFunction' },
  { code: 'Sales.accept', name: 'Accept sale', className: 'SalesAcceptFunction' },
  { code: 'Sales.cancel', name: 'Cancel sale', className: 'SalesCancelFunction' },
  { code: 'Sales.approve', name: 'Approve sale', className: 'SalesApproveFunction' },
  { code: 'Sales.reject', name: 'Reject sale', className: 'SalesRejectFunction' },
  {
    code: 'SalesReturn.reserve',
    name: 'Reserve sales return',
    className: 'SalesReturnReserveFunction',
  },
  {
    code: 'SalesReturn.accept',
    name: 'Accept sales return',
    className: 'SalesReturnAcceptFunction',
  },
  {
    code: 'SalesReturn.cancel',
    name: 'Cancel sales return',
    className: 'SalesReturnCancelFunction',
  },
  {
    code: 'SalesReturn.approve',
    name: 'Approve sales return',
    className: 'SalesReturnApproveFunction',
  },
  {
    code: 'SalesReturn.reject',
    name: 'Reject sales return',
    className: 'SalesReturnRejectFunction',
  },
  {
    code: 'Transfer.updateStatus',
    name: 'Update transfer status',
    className: 'TransferUpdateStatusFunction',
  },
  {
    code: 'Transfer.openStockOut',
    name: 'Open transfer stock out',
    className: 'TransferOpenStockOutFunction',
  },
  { code: 'Transfer.dispatch', name: 'Dispatch transfer', className: 'TransferDispatchFunction' },
  { code: 'Transfer.arrive', name: 'Arrive transfer', className: 'TransferArriveFunction' },
  { code: 'Transfer.receive', name: 'Receive transfer', className: 'TransferReceiveFunction' },
  { code: 'Transfer.reject', name: 'Reject transfer', className: 'TransferRejectFunction' },
  {
    code: 'Transfer.courierReturn',
    name: 'Courier returned transfer',
    className: 'TransferCourierReturnFunction',
  },
];

export const retiredFunctionCodes = [
  'StockOut.release',
  'Sales.release',
  'Transfer.reserve',
  'Transfer.release',
];

const statusUpdate = (status: RequestStatus): WorkflowFunctionLink => ({
  requestType: RequestType.Transfer,
  status,
  functionKey: 'Transfer.updateStatus',
  priority: 1,
});

export const businessLinks: WorkflowFunctionLink[] = [
  {
    requestType: RequestType.StockIn,
    status: RequestStatus.Pending,
    functionKey: 'StockIn.reserve',
    priority: 1,
  },
  {
    requestType: RequestType.StockIn,
    status: RequestStatus.Approved,
    functionKey: 'StockIn.accept',
    priority: 1,
  },
  {
    requestType: RequestType.StockIn,
    status: RequestStatus.Approved,
    functionKey: 'StockIn.approve',
    priority: 2,
  },
  {
    requestType: RequestType.StockIn,
    status: RequestStatus.Rejected,
    functionKey: 'StockIn.cancel',
    priority: 1,
  },
  {
    requestType: RequestType.StockIn,
    status: RequestStatus.Rejected,
    functionKey: 'StockIn.reject',
    priority: 2,
  },

  {
    requestType: RequestType.StockOut,
    status: RequestStatus.Pending,
    functionKey: 'StockOut.reserve',
    priority: 1,
  },
  {
    requestType: RequestType.StockOut,
    status: RequestStatus.Approved,
    functionKey: 'StockOut.accept',
    priority: 1,
  },
  {
    requestType: RequestType.StockOut,
    status: RequestStatus.Approved,
    functionKey: 'StockOut.approve',
    priority: 2,
  },
  {
    requestType: RequestType.StockOut,
    status: RequestStatus.Rejected,
    functionKey: 'StockOut.cancel',
    priority: 1,
  },
  {
    requestType: RequestType.StockOut,
    status: RequestStatus.Rejected,
    functionKey: 'StockOut.reject',
    priority: 2,
  },

  {
    requestType: RequestType.Sales,
    status: RequestStatus.Pending,
    functionKey: 'Sales.reserve',
    priority: 1,
  },
  {
    requestType: RequestType.Sales,
    status: RequestStatus.Approved,
    functionKey: 'Sales.accept',
    priority: 1,
  },
  {
    requestType: RequestType.Sales,
    status: RequestStatus.Approved,
    functionKey: 'Sales.approve',
    priority: 2,
  },
  {
    requestType: RequestType.Sales,
    status: RequestStatus.Rejected,
    functionKey: 'Sales.cancel',
    priority: 1,
  },
  {
    requestType: RequestType.Sales,
    status: RequestStatus.Rejected,
    functionKey: 'Sales.reject',
    priority: 2,
  },

  {
    requestType: RequestType.SalesReturn,
    status: RequestStatus.Pending,
    functionKey: 'SalesReturn.reserve',
    priority: 1,
  },
  {
    requestType: RequestType.SalesReturn,
    status: RequestStatus.Approved,
    functionKey: 'SalesReturn.accept',
    priority: 1,
  },
  {
    requestType: RequestType.SalesReturn,
    status: RequestStatus.Approved,
    functionKey: 'SalesReturn.approve',
    priority: 2,
  },
  {
    requestType: RequestType.SalesReturn,
    status: RequestStatus.Rejected,
    functionKey: 'SalesReturn.cancel',
    priority: 1,
  },
  {
    requestType: RequestType.SalesReturn,
    status: RequestStatus.Rejected,
    functionKey: 'SalesReturn.reject',
    priority: 2,
  },

  statusUpdate(RequestStatus.Approved),
  {
    requestType: RequestType.Transfer,
    status: RequestStatus.Approved,
    functionKey: 'Transfer.openStockOut',
    priority: 2,
  },
  statusUpdate(RequestStatus.Dispatched),
  {
    requestType: RequestType.Transfer,
    status: RequestStatus.Dispatched,
    functionKey: 'Transfer.dispatch',
    priority: 2,
  },
  statusUpdate(RequestStatus.InTransit),
  statusUpdate(RequestStatus.InProcess),
  statusUpdate(RequestStatus.ArrivedAtStation),
  {
    requestType: RequestType.Transfer,
    status: RequestStatus.ArrivedAtStation,
    functionKey: 'Transfer.arrive',
    priority: 2,
  },
  statusUpdate(RequestStatus.Received),
  {
    requestType: RequestType.Transfer,
    status: RequestStatus.Received,
    functionKey: 'Transfer.receive',
    priority: 2,
  },
  statusUpdate(RequestStatus.Rejected),
  {
    requestType: RequestType.Transfer,
    status: RequestStatus.Rejected,
    functionKey: 'Transfer.reject',
    priority: 2,
  },
  statusUpdate(RequestStatus.CourierReturned),
  {
    requestType: RequestType.Transfer,
    status: RequestStatus.CourierReturned,
    functionKey: 'Transfer.courierReturn',
    priority: 2,
  },
];

export const retiredLinks: Pick<WorkflowFunctionLink, 'requestType' | 'status' | 'functionKey'>[] =
  [
    {
      requestType: RequestType.StockOut,
      status: RequestStatus.Approved,
      functionKey: 'StockOut.release',
    },
    {
      requestType: RequestType.StockOut,
      status: RequestStatus.Rejected,
      functionKey: 'StockOut.release',
    },
    {
      requestType: RequestType.Sales,
      status: RequestStatus.Approved,
      functionKey: 'Sales.release',
    },
    {
      requestType: RequestType.Sales,
      status: RequestStatus.Rejected,
      functionKey: 'Sales.release',
    },
    {
      requestType: RequestType.Transfer,
      status: RequestStatus.Pending,
      functionKey: 'Transfer.reserve',
    },
    {
      requestType: RequestType.Transfer,
      status: RequestStatus.Rejected,
      functionKey: 'Transfer.release',
    },
  ];
