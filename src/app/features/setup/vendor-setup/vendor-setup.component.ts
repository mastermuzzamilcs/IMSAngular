import { ConfirmService } from '../../../core/services/confirm.service';
import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { VendorFormComponent } from '../vendor-form/vendor-form.component';
import { CommonModule } from '@angular/common';
import { MxBadgeComponent, MxButtonComponent, MxEmptyStateComponent, MxGridComponent, MxPageHeaderComponent, MxNoticeService } from '@mesix/custom-control';
import { MatIconModule } from '@angular/material/icon';
import { LoadingService } from '../../../core/services/Loading.service';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { VendorService } from '../../../core/services/vendor.service';
import { Vendor } from '../../../core/Models/VendorModel';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-vendor-setup',
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
  templateUrl: './vendor-setup.component.html',
  styleUrl: './vendor-setup.component.scss',
  standalone: true,
})
export class VendorSetupComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);
  private readonly confirm = inject(ConfirmService);

  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['name', 'location', 'description', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>();
  tableLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _vendorService: VendorService,
    private _loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadVendors();
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

  async loadVendors() {
    this.tableLoading = true;
    try {
      const Vendors = await this._vendorService.getVendors();
      this.dataSource.data = Vendors;
    } catch (err) {
      console.error('Error loading Vendors', err);
      this.toast.error('Error loading Vendors');
    }
    this.tableLoading = false;
  }

  openAddDialog() {
    const dialogRef = this.notice.open(VendorFormComponent, {
      data: { mode: 'add' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this._loadingService.show();
        await this._vendorService.addVendor(result);
        this._loadingService.hide();
        this.loadVendors();
      }
    });
  }

  openEditDialog(_vendor: Vendor) {
    const dialogRef = this.notice.open(VendorFormComponent, {
      data: { mode: 'edit', _vendor }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this._loadingService.show();
        result.id = _vendor.id;
        await this._vendorService.updateVendor(result);
        this._loadingService.hide();
        this.loadVendors();
      }
    });
  }
  openDeleteDialog(_vendor: Vendor) {
    this.confirm.confirmDelete(`Are you sure you want to delete "${_vendor.name}"?`, 'Delete Vendor').subscribe(async (result) => {
      if (result) {
        if (_vendor.id) {
          this._loadingService.show();
          await this._vendorService.deleteVendor(_vendor.id);
          this._loadingService.hide();
          this.loadVendors();
        }
      }
    });
  }
}

