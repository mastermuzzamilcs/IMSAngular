import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransferListComponent } from './list/transfer-list.component';

const routes: Routes = [
  {
    path: '',
    component: TransferListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TransfersRoutingModule {}
