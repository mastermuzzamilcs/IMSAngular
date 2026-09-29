import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BrandFormComponent } from '../brand-form/brand-form.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LoadingService } from '../../../core/services/Loading.service';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { GlobalDeleteConfirmationComponent } from '../../../shared/components/global-delete-confirmation/global-delete-confirmation.component';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Brand } from '../../../core/Models/BrandModel';
import { BrandService } from '../../../core/services/brand.service';

@Component({
  selector: 'app-brand-setup',
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
    const dialogRef = this.dialog.open(GlobalDeleteConfirmationComponent, {
      width: '300px',
      data: {
        title: 'Delete Brand',
        message: `Are you sure you want to delete "${_brand.name}"?`,
      },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
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
