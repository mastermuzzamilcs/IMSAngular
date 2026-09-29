import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductsSetupComponent } from './products-setup/products-setup.component';

const routes: Routes = [
  {
    path: '',
    component: ProductsSetupComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SetupRoutingModule {}
