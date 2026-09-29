import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
//import { InventoryFormComponent } from './form/inventory-form.component';
import { InventoryListComponent } from './list/inventory-list.component';

const routes: Routes = [{ path: '', component: InventoryListComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InventoryRoutingModule {}
