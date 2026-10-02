import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SalesListComponent } from './list/sales-list.component';
import { SalesComponent } from './sales/sales.component';
import { SalesReturnComponent } from './sales-return/sales-return.component';

const routes: Routes = [
  {
    path: '',
    component: SalesListComponent,
  },
  {
    path: 'sales',
    component: SalesComponent,
  },
  {
    path: 'sales-return',
    component: SalesReturnComponent,
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
