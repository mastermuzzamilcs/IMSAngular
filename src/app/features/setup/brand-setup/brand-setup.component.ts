import { ConfirmService } from '../../../core/services/confirm.service';
import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { BrandFormComponent } from '../brand-form/brand-form.component';
import { CommonModule } from '@angular/common';
import { MxBadgeComponent, MxButtonComponent, MxEmptyStateComponent, MxGridComponent, MxPageHeaderComponent, MxNoticeService } from '@mesix/custom-control';
import { MatIconModule } from '@angular/material/icon';
import { LoadingService } from '../../../core/services/Loading.service';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Brand } from '../../../core/Models/BrandModel';
import { BrandService } from '../../../core/services/brand.service';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-brand-setup',
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
  templateUrl: './brand-setup.component.html',
  styleUrl: './brand-setup.component.scss',
  standalone: true,
})
export class BrandSetupComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);
  private readonly confirm = inject(ConfirmService);

  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['name', 'description', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>();
  tableLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _brandService: BrandService,
    private _loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadBrands();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.onGridFilter((event.target as HTMLInputElement).value);
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  async loadBrands() {
    this.tableLoading = true;
    try {
      const brands = await this._brandService.getBrands();
      this.dataSource.data = brands;
    } catch (err) {
      console.error('Error loading Brands', err);
      this.toast.error('Error loading Brands');
    }
    this.tableLoading = false;
  }

  openAddDialog() {
    const dialogRef = this.notice.open(BrandFormComponent, {
      data: { mode: 'add' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this._loadingService.show();
        await this._brandService.addBrand(result);
        this._loadingService.hide();
        this.loadBrands();
      }
    });
  }

  openEditDialog(_brand: Brand) {
    const dialogRef = this.notice.open(BrandFormComponent, {
      data: { mode: 'edit', _brand }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this._loadingService.show();
        result.id = _brand.id;
        await this._brandService.updateBrand(result);
        this._loadingService.hide();
        this.loadBrands();
      }
    });
  }
  openDeleteDialog(_brand: Brand) {
    this.confirm.confirmDelete(`Are you sure you want to delete "${_brand.name}"?`, 'Delete Brand').subscribe(async (result) => {
      if (result) {
        if (_brand.id) {
          this._loadingService.show();
          await this._brandService.deleteBrand(_brand.id);
          this._loadingService.hide();
          this.loadBrands();
        }
      }
    });
  }
}

