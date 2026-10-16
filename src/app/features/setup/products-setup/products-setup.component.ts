import { ConfirmService } from '../../../core/services/confirm.service';
import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { ProductsFormComponent } from '../products-form/products-form.component';
import { CommonModule } from '@angular/common';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
  MxNoticeService,
} from '@mesix/custom-control';
import { MatIconModule } from '@angular/material/icon';
import { LoadingService } from '../../../core/services/Loading.service';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/Models/ProductModel';
import { BrandService } from '../../../core/services/brand.service';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-products-setup',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatSortModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxBadgeComponent,
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './products-setup.component.html',
  styleUrl: './products-setup.component.scss',
  standalone: true,
})
export class ProductsSetupComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);
  private readonly confirm = inject(ConfirmService);

  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['name', 'brand', 'description', 'price', 'status', 'actions'];
  dataSource = new MatTableDataSource<Product>();
  tableLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _productService: ProductService,
    private _brandService: BrandService,
    private _loadingService: LoadingService,
  ) {}

  ngOnInit() {
    this.loadProducts();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    this.onGridFilter((event.target as HTMLInputElement).value);
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  async loadProducts() {
    this.tableLoading = true;
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
      this.toast.error('Error loading Products');
    }
    this.tableLoading = false;
  }

  openAddDialog() {
    const dialogRef = this.notice.open(ProductsFormComponent, {
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
    const dialogRef = this.notice.open(ProductsFormComponent, {
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
      .confirmDelete(
        `Are you sure you want to delete Product "${_product.name}"?`,
        'Delete Product',
      )
      .subscribe(async (result) => {
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
