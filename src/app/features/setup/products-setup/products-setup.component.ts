import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductsFormComponent } from '../products-form/products-form.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LoadingService } from '../../../core/services/Loading.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/Models/ProductModel';
import { BrandService } from '../../../core/services/brand.service';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxGridComponent,
  MxEmptyStateComponent,
  MxPageHeaderComponent,
} from '@mesix/custom-control';

@Component({
  selector: 'app-products-setup',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatDialogModule,
    MatSortModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxBadgeComponent,
    MxEmptyStateComponent,
  ],
  templateUrl: './products-setup.component.html',
  styleUrl: './products-setup.component.scss',
  standalone: true,
})
export class ProductsSetupComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'brand', 'description', 'price', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _productService: ProductService,
    private _brandService: BrandService,
    private _loadingService: LoadingService,
    private dialog: MatDialog,
    private confirm: ConfirmService,
  ) {}

  ngOnInit() {
    this.loadProducts();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  async loadProducts() {
    this._loadingService.show();
    try {
      const Products = await this._productService.getProducts();
      const ProductsWithBrandNames = await Promise.all(
        Products.map(async (product) => {
          const matchedBrand = await this._brandService.getBrandById(product.brandId);
          return {
            ...product,
            brand: matchedBrand ? matchedBrand.name : 'Unknown',
          };
        }),
      );
      this.dataSource.data = ProductsWithBrandNames;
    } catch (err) {
      console.error('Error loading Products', err);
      alert('Error loading Products');
    }
    this._loadingService.hide();
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(ProductsFormComponent, {
      width: '500px',
      data: { mode: 'add' },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this._loadingService.show();
        await this._productService.addProduct(result);
        this._loadingService.hide();
        this.loadProducts();
      }
    });
  }

  openEditDialog(_product: Product) {
    const dialogRef = this.dialog.open(ProductsFormComponent, {
      width: '500px',
      data: { mode: 'edit', _product },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this._loadingService.show();
        result.id = _product.id;
        await this._productService.updateProduct(result);
        this._loadingService.hide();
        this.loadProducts();
      }
    });
  }

  openDeleteDialog(_product: Product) {
    this.confirm
      .confirmDelete(`Are you sure you want to delete "${_product.name}"?`, 'Delete Product')
      .subscribe(async (confirmed) => {
        if (confirmed && _product.id) {
          this._loadingService.show();
          await this._productService.deleteProduct(_product.id);
          this._loadingService.hide();
          this.loadProducts();
        }
      });
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }
}
