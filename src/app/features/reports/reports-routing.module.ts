import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportCenterComponent } from './report-center.component';
import { privilegeGuard } from '../../core/guards/privilege.guard';
import { privileges } from '../../core/auth/privilege-catalog';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inventory-on-hand' },
  { path: 'inventory-on-hand', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.inventoryOnHand.page, reportId: 'inventory-on-hand' } },
  { path: 'sales-summary', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.salesStockOut.page, reportId: 'sales-summary' } },
  { path: 'vendor-purchase-summary', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.purchasesReturns.page, reportId: 'vendor-purchase-summary' } },
  { path: 'cash-flow', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.cashFlow.page, reportId: 'cash-flow' } },
  { path: 'low-stock', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.lowStock.page, reportId: 'low-stock' } },
  { path: 'inventory-valuation', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.inventoryValuation.page, reportId: 'inventory-valuation' } },
  { path: 'stock-movement', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.stockMovement.page, reportId: 'stock-movement' } },
  { path: 'dead-slow-stock', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.deadSlowStock.page, reportId: 'dead-slow-stock' } },
  { path: 'sales-by-product', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.salesByProduct.page, reportId: 'sales-by-product' } },
  { path: 'customer-sales-returns', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.customerSalesReturns.page, reportId: 'customer-sales-returns' } },
  { path: 'discount-impact', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.discountImpact.page, reportId: 'discount-impact' } },
  { path: 'transfer-performance', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.transferPerformance.page, reportId: 'transfer-performance' } },
  { path: 'transfer-fill-rate', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.transferFillRate.page, reportId: 'transfer-fill-rate' } },
  { path: 'workflow-aging', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.workflowAging.page, reportId: 'workflow-aging' } },
  { path: 'branch-comparison', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.branchComparison.page, reportId: 'branch-comparison' } },
  { path: 'approver-throughput', component: ReportCenterComponent, canActivate: [privilegeGuard], data: { privilege: privileges.reports.approverThroughput.page, reportId: 'approver-throughput' } },
  { path: 'sales-stock-out', pathMatch: 'full', redirectTo: 'sales-summary' },
  { path: 'purchases-returns', pathMatch: 'full', redirectTo: 'vendor-purchase-summary' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportsRoutingModule {}
