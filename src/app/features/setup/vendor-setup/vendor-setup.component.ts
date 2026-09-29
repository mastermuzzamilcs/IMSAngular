import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VendorFormComponent } from '../vendor-form/vendor-form.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LoadingService } from '../../../core/services/Loading.service';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { GlobalDeleteConfirmationComponent } from '../../../shared/components/global-delete-confirmation/global-delete-confirmation.component';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { VendorService } from '../../../core/services/vendor.service';
import { Vendor } from '../../../core/Models/VendorModel';

@Component({
  selector: 'app-vendor-setup',
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
  templateUrl: './vendor-setup.component.html',
  styleUrl: './vendor-setup.component.scss',
  standalone: true,
})
export class VendorSetupComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'location', 'description', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _vendorService: VendorService,
    private _loadingService: LoadingService,
    private dialog: MatDialog,
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
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  async loadVendors() {
    this._loadingService.show();
    try {
      const Vendors = await this._vendorService.getVendors();
      this.dataSource.data = Vendors;
    } catch (err) {
      console.error('Error loading Vendors', err);
      alert('Error loading Vendors');
    }
    this._loadingService.hide();
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(VendorFormComponent, {
      width: '500px',
      data: { mode: 'add' },
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
    const dialogRef = this.dialog.open(VendorFormComponent, {
      width: '500px',
      data: { mode: 'edit', _vendor },
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
    const dialogRef = this.dialog.open(GlobalDeleteConfirmationComponent, {
      width: '300px',
      data: {
        title: 'Delete Vendor',
        message: `Are you sure you want to delete "${_vendor.name}"?`,
      },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
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
