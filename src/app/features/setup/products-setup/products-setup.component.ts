import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProductsFormComponent } from '../products-form/products-form.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LoadingService } from '../../../core/services/Loading.service';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { GlobalDeleteConfirmationComponent } from '../../../shared/components/global-delete-confirmation/global-delete-confirmation.component';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/Models/ProductModel';
import { BrandService } from '../../../core/services/brand.service';

@Component({
  selector: 'app-products-setup',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatChipsModule,
    MatSortModule,
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
    const dialogRef = this.dialog.open(GlobalDeleteConfirmationComponent, {
      width: '300px',
      data: {
        title: 'Delete Product',
        message: `Are you sure you want to Product "${_product.name}"?`,
      },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        if (_product.id) {
          this._loadingService.show();
          await this._productService.deleteProduct(_product.id);
          this._loadingService.hide();
          this.loadProducts();
        }
      }
    });
  }
}
