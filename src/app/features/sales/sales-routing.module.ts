import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesListComponent } from './list/sales-list.component';

const routes: Routes = [
  {
    path: '',
    component: SalesListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SalesRoutingModule {}
