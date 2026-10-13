import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BrandFormComponent } from '../brand-form/brand-form.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LoadingService } from '../../../core/services/Loading.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Brand } from '../../../core/Models/BrandModel';
import { BrandService } from '../../../core/services/brand.service';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxGridComponent,
  MxEmptyStateComponent,
  MxPageHeaderComponent,
} from '@mesix/custom-control';

@Component({
  selector: 'app-brand-setup',
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
  templateUrl: './brand-setup.component.html',
  styleUrl: './brand-setup.component.scss',
  standalone: true,
})
export class BrandSetupComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'description', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _brandService: BrandService,
    private _loadingService: LoadingService,
    private dialog: MatDialog,
    private confirm: ConfirmService,
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
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  async loadBrands() {
    this._loadingService.show();
    try {
      const brands = await this._brandService.getBrands();
      this.dataSource.data = brands;
    } catch (err) {
      console.error('Error loading Brands', err);
      alert('Error loading Brands');
    }
    this._loadingService.hide();
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(BrandFormComponent, {
      width: '500px',
      data: { mode: 'add' },
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
    const dialogRef = this.dialog.open(BrandFormComponent, {
      width: '500px',
      data: { mode: 'edit', _brand },
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
    this.confirm
      .confirmDelete(`Are you sure you want to delete "${_brand.name}"?`, 'Delete Brand')
      .subscribe(async (confirmed) => {
        if (confirmed && _brand.id) {
          this._loadingService.show();
          await this._brandService.deleteBrand(_brand.id);
          this._loadingService.hide();
          this.loadBrands();
        }
      });
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }
}
