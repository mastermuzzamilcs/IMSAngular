import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ProductService } from '../../../core/services/product.service';
import { BrandService } from '../../../core/services/brand.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LoadingService } from '../../../core/services/Loading.service';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-item-search-modal',
  templateUrl: './item-search-modal.component.html',
  styleUrls: ['./item-search-modal.component.scss'],
  imports: [
    MatIconModule,
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatCheckboxModule,
  ],
})
export class ItemSearchModalComponent {
  searchForm: FormGroup;
  brands: any[] = [];
  productList: any[] = [];
  selectedProduct: any = null;
  displayedColumns: string[] = ['select', 'name', 'brand', 'description', 'price'];

  selection = new SelectionModel<any>(true, []);

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private brandService: BrandService,
    private _loadingService: LoadingService,
    public dialogRef: MatDialogRef<ItemSearchModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.searchForm = this.fb.group({
      brandId: [''],
      name: [''],
      description: [''],
    });

    this.loadBrands();
  }

  async loadBrands() {
    this._loadingService.show();
    this.brands = await this.brandService.getBrands();
    this._loadingService.hide();
  }

  async searchProducts() {
    this._loadingService.show();
    const filters = this.searchForm.value;
    this.productList = await this.productService.searchProducts(
      filters['brandId'],
      filters['name'],
      filters['description'],
    );
    this._loadingService.hide();
  }

  selectRow(row: any) {
    this.selectedProduct = row;
  }
  selectItem(row: any) {
    this.dialogRef.close(row);
  }
  onCancel() {
    this.dialogRef.close(null);
  }
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.productList.length;
    return numSelected === numRows;
  }
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.productList.forEach((row) => this.selection.select(row));
  }
  onConfirm(): void {
    this.dialogRef.close(this.selection.selected);
  }
}
