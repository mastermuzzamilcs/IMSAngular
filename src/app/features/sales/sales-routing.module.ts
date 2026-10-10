import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { privileges } from '../../core/auth/privilege-catalog';
import { privilegeGuard } from '../../core/guards/privilege.guard';

import { SalesListComponent } from './list/sales-list.component';
import { SalesComponent } from './sales/sales.component';
import { SalesReturnComponent } from './sales-return/sales-return.component';

const routes: Routes = [
  {
    path: '',
    component: SalesListComponent,
    canActivate: [privilegeGuard],
    data: { privilege: privileges.salesOverview.page },
  },
  {
    path: 'sales',
    component: SalesComponent,
    canActivate: [privilegeGuard],
    data: { privilege: privileges.sales.page },
  },
  {
    path: 'sales-return',
    component: SalesReturnComponent,
    canActivate: [privilegeGuard],
    data: { privilege: privileges.salesReturn.page },
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    SalesListComponent,
    SalesComponent,
    SalesReturnComponent,
  ],
  exports: [RouterModule],
})
export class SalesRoutingModule {}
