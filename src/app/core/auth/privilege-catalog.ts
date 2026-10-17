import { ApplicationId, PrivilegeFunction, PrivilegeModule } from '../enums/privilege.enum';

export interface PrivilegeRef {
  applicationId: ApplicationId;
  moduleId: PrivilegeModule;
  functionId: PrivilegeFunction;
}

export interface CatalogPrivilege extends PrivilegeRef {
  moduleName: string;
  action: string;
}

const actionName: Record<PrivilegeFunction, string> = {
  [PrivilegeFunction.Page]: 'Page',
  [PrivilegeFunction.Create]: 'Create',
  [PrivilegeFunction.Details]: 'Details',
  [PrivilegeFunction.Delete]: 'Delete',
  [PrivilegeFunction.Edit]: 'Edit',
};

function defs(
  moduleId: PrivilegeModule,
  moduleName: string,
  functions: PrivilegeFunction[],
): CatalogPrivilege[] {
  return functions.map((functionId) => ({
    applicationId: ApplicationId.Ims,
    moduleId,
    functionId,
    moduleName,
    action: actionName[functionId],
  }));
}

function ref(moduleId: PrivilegeModule, functionId: PrivilegeFunction): PrivilegeRef {
  return { applicationId: ApplicationId.Ims, moduleId, functionId };
}

const page = PrivilegeFunction.Page;
const create = PrivilegeFunction.Create;
const details = PrivilegeFunction.Details;
const remove = PrivilegeFunction.Delete;
const edit = PrivilegeFunction.Edit;

export const privilegeCatalog: CatalogPrivilege[] = [
  ...defs(PrivilegeModule.Dashboard, 'Dashboard', [page]),
  ...defs(PrivilegeModule.Branches, 'Branches', [page, create, edit, remove]),
  ...defs(PrivilegeModule.Inventory, 'Inventory', [page]),
  ...defs(PrivilegeModule.StockIn, 'Stock In', [page, create, remove]),
  ...defs(PrivilegeModule.StockOut, 'Stock Out', [page, create, remove]),
  ...defs(PrivilegeModule.SalesOverview, 'Sales Overview', [page, details]),
  ...defs(PrivilegeModule.Sales, 'Sales', [page, create, remove]),
  ...defs(PrivilegeModule.SalesReturn, 'Sales Return', [page, create, remove]),
  ...defs(PrivilegeModule.Reports, 'Reports', [page]),
  ...defs(PrivilegeModule.ReportInventoryOnHand, 'Report: Stock on hand', [page]),
  ...defs(PrivilegeModule.ReportSalesStockOut, 'Report: Sales summary', [page]),
  ...defs(PrivilegeModule.ReportPurchasesReturns, 'Report: Vendor purchase summary', [page]),
  ...defs(PrivilegeModule.ReportCashFlow, 'Report: Cash flow ledger', [page]),
  ...defs(PrivilegeModule.ReportLowStock, 'Report: Low / out-of-stock', [page]),
  ...defs(PrivilegeModule.ReportInventoryValuation, 'Report: Inventory valuation', [page]),
  ...defs(PrivilegeModule.ReportStockMovement, 'Report: Stock movement ledger', [page]),
  ...defs(PrivilegeModule.ReportDeadSlowStock, 'Report: Dead / slow stock', [page]),
  ...defs(PrivilegeModule.ReportSalesByProduct, 'Report: Sales by product / brand', [page]),
  ...defs(PrivilegeModule.ReportCustomerSalesReturns, 'Report: Customer sales & returns', [page]),
  ...defs(PrivilegeModule.ReportDiscountImpact, 'Report: Discount impact', [page]),
  ...defs(PrivilegeModule.ReportTransferPerformance, 'Report: Transfer performance', [page]),
  ...defs(PrivilegeModule.ReportTransferFillRate, 'Report: Transfer fill rate', [page]),
  ...defs(PrivilegeModule.ReportWorkflowAging, 'Report: Request / workflow aging', [page]),
  ...defs(PrivilegeModule.ReportBranchComparison, 'Report: Branch comparison', [page]),
  ...defs(PrivilegeModule.ReportApproverThroughput, 'Report: Approver / team throughput', [page]),
  ...defs(PrivilegeModule.WorkflowRequests, 'Workflow Requests', [page, details]),
  ...defs(PrivilegeModule.NewTransfer, 'New Transfer', [page, create, remove]),
  ...defs(PrivilegeModule.Users, 'Users', [page, create, edit]),
  ...defs(PrivilegeModule.Roles, 'Roles', [page, create, edit, remove]),
  ...defs(PrivilegeModule.UserGroups, 'User Groups', [page, create, edit, remove]),
  ...defs(PrivilegeModule.GroupAssociations, 'Group Associations', [page, create, remove]),
  ...defs(PrivilegeModule.BranchAssociations, 'Branch Associations', [page, create, remove]),
  ...defs(PrivilegeModule.Products, 'Products', [page, create, edit, remove]),
  ...defs(PrivilegeModule.Vendors, 'Vendors', [page, create, edit, remove]),
  ...defs(PrivilegeModule.Customers, 'Customers', [page, create, edit, remove]),
  ...defs(PrivilegeModule.Brands, 'Brands', [page, create, edit, remove]),
  ...defs(PrivilegeModule.WorkflowTransitions, 'Status Transitions', [page, create, edit, remove]),
  ...defs(PrivilegeModule.WorkflowFunctions, 'Workflow Functions', [page, create, edit, remove]),
  ...defs(PrivilegeModule.GroupPrivileges, 'Group Privileges', [page, edit]),
  ...defs(PrivilegeModule.NotificationTemplates, 'Notification Templates', [
    page,
    create,
    edit,
    remove,
  ]),
  ...defs(PrivilegeModule.ItemSources, 'Item Sources', [page, create, edit, remove]),
  ...defs(PrivilegeModule.Settings, 'Settings', [page, edit]),
];

export const privileges = {
  dashboard: { page: ref(PrivilegeModule.Dashboard, page) },
  branches: {
    page: ref(PrivilegeModule.Branches, page),
    create: ref(PrivilegeModule.Branches, create),
    edit: ref(PrivilegeModule.Branches, edit),
    delete: ref(PrivilegeModule.Branches, remove),
  },
  inventory: { page: ref(PrivilegeModule.Inventory, page) },
  stockIn: {
    page: ref(PrivilegeModule.StockIn, page),
    create: ref(PrivilegeModule.StockIn, create),
    delete: ref(PrivilegeModule.StockIn, remove),
  },
  stockOut: {
    page: ref(PrivilegeModule.StockOut, page),
    create: ref(PrivilegeModule.StockOut, create),
    delete: ref(PrivilegeModule.StockOut, remove),
  },
  salesOverview: {
    page: ref(PrivilegeModule.SalesOverview, page),
    details: ref(PrivilegeModule.SalesOverview, details),
  },
  sales: {
    page: ref(PrivilegeModule.Sales, page),
    create: ref(PrivilegeModule.Sales, create),
    delete: ref(PrivilegeModule.Sales, remove),
  },
  salesReturn: {
    page: ref(PrivilegeModule.SalesReturn, page),
    create: ref(PrivilegeModule.SalesReturn, create),
    delete: ref(PrivilegeModule.SalesReturn, remove),
  },
  reports: {
    page: ref(PrivilegeModule.Reports, page),
    inventoryOnHand: { page: ref(PrivilegeModule.ReportInventoryOnHand, page) },
    salesStockOut: { page: ref(PrivilegeModule.ReportSalesStockOut, page) },
    purchasesReturns: { page: ref(PrivilegeModule.ReportPurchasesReturns, page) },
    cashFlow: { page: ref(PrivilegeModule.ReportCashFlow, page) },
    lowStock: { page: ref(PrivilegeModule.ReportLowStock, page) },
    inventoryValuation: { page: ref(PrivilegeModule.ReportInventoryValuation, page) },
    stockMovement: { page: ref(PrivilegeModule.ReportStockMovement, page) },
    deadSlowStock: { page: ref(PrivilegeModule.ReportDeadSlowStock, page) },
    salesByProduct: { page: ref(PrivilegeModule.ReportSalesByProduct, page) },
    vendorPurchaseSummary: { page: ref(PrivilegeModule.ReportPurchasesReturns, page) },
    customerSalesReturns: { page: ref(PrivilegeModule.ReportCustomerSalesReturns, page) },
    discountImpact: { page: ref(PrivilegeModule.ReportDiscountImpact, page) },
    transferPerformance: { page: ref(PrivilegeModule.ReportTransferPerformance, page) },
    transferFillRate: { page: ref(PrivilegeModule.ReportTransferFillRate, page) },
    workflowAging: { page: ref(PrivilegeModule.ReportWorkflowAging, page) },
    branchComparison: { page: ref(PrivilegeModule.ReportBranchComparison, page) },
    approverThroughput: { page: ref(PrivilegeModule.ReportApproverThroughput, page) },
  },
  workflowRequests: {
    page: ref(PrivilegeModule.WorkflowRequests, page),
    details: ref(PrivilegeModule.WorkflowRequests, details),
  },
  newTransfer: {
    page: ref(PrivilegeModule.NewTransfer, page),
    create: ref(PrivilegeModule.NewTransfer, create),
    delete: ref(PrivilegeModule.NewTransfer, remove),
  },
  users: {
    page: ref(PrivilegeModule.Users, page),
    create: ref(PrivilegeModule.Users, create),
    edit: ref(PrivilegeModule.Users, edit),
  },
  roles: {
    page: ref(PrivilegeModule.Roles, page),
    create: ref(PrivilegeModule.Roles, create),
    edit: ref(PrivilegeModule.Roles, edit),
    delete: ref(PrivilegeModule.Roles, remove),
  },
  userGroups: {
    page: ref(PrivilegeModule.UserGroups, page),
    create: ref(PrivilegeModule.UserGroups, create),
    edit: ref(PrivilegeModule.UserGroups, edit),
    delete: ref(PrivilegeModule.UserGroups, remove),
  },
  groupAssociations: {
    page: ref(PrivilegeModule.GroupAssociations, page),
    create: ref(PrivilegeModule.GroupAssociations, create),
    delete: ref(PrivilegeModule.GroupAssociations, remove),
  },
  branchAssociations: {
    page: ref(PrivilegeModule.BranchAssociations, page),
    create: ref(PrivilegeModule.BranchAssociations, create),
    delete: ref(PrivilegeModule.BranchAssociations, remove),
  },
  products: {
    page: ref(PrivilegeModule.Products, page),
    create: ref(PrivilegeModule.Products, create),
    edit: ref(PrivilegeModule.Products, edit),
    delete: ref(PrivilegeModule.Products, remove),
  },
  vendors: {
    page: ref(PrivilegeModule.Vendors, page),
    create: ref(PrivilegeModule.Vendors, create),
    edit: ref(PrivilegeModule.Vendors, edit),
    delete: ref(PrivilegeModule.Vendors, remove),
  },
  customers: {
    page: ref(PrivilegeModule.Customers, page),
    create: ref(PrivilegeModule.Customers, create),
    edit: ref(PrivilegeModule.Customers, edit),
    delete: ref(PrivilegeModule.Customers, remove),
  },
  brands: {
    page: ref(PrivilegeModule.Brands, page),
    create: ref(PrivilegeModule.Brands, create),
    edit: ref(PrivilegeModule.Brands, edit),
    delete: ref(PrivilegeModule.Brands, remove),
  },
  workflowTransitions: {
    page: ref(PrivilegeModule.WorkflowTransitions, page),
    create: ref(PrivilegeModule.WorkflowTransitions, create),
    edit: ref(PrivilegeModule.WorkflowTransitions, edit),
    delete: ref(PrivilegeModule.WorkflowTransitions, remove),
  },
  workflowFunctions: {
    page: ref(PrivilegeModule.WorkflowFunctions, page),
    create: ref(PrivilegeModule.WorkflowFunctions, create),
    edit: ref(PrivilegeModule.WorkflowFunctions, edit),
    delete: ref(PrivilegeModule.WorkflowFunctions, remove),
  },
  groupPrivileges: {
    page: ref(PrivilegeModule.GroupPrivileges, page),
    edit: ref(PrivilegeModule.GroupPrivileges, edit),
  },
  notificationTemplates: {
    page: ref(PrivilegeModule.NotificationTemplates, page),
    create: ref(PrivilegeModule.NotificationTemplates, create),
    edit: ref(PrivilegeModule.NotificationTemplates, edit),
    delete: ref(PrivilegeModule.NotificationTemplates, remove),
  },
  itemSources: {
    page: ref(PrivilegeModule.ItemSources, page),
    create: ref(PrivilegeModule.ItemSources, create),
    edit: ref(PrivilegeModule.ItemSources, edit),
    delete: ref(PrivilegeModule.ItemSources, remove),
  },
  settings: {
    page: ref(PrivilegeModule.Settings, page),
    edit: ref(PrivilegeModule.Settings, edit),
  },
};

export function privilegeKey(item: PrivilegeRef): string {
  return `${item.applicationId}:${item.moduleId}:${item.functionId}`;
}
