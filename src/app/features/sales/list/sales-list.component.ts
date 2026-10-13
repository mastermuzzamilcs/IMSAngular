import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { SalesFormComponent } from '../form/sales-form.component';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxGridComponent,
  MxEmptyStateComponent,
  MxPageHeaderComponent,
} from '@mesix/custom-control';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    MatPaginatorModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    CommonModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxBadgeComponent,
    MxEmptyStateComponent,
  ],
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss'],
})
export class SalesListComponent implements AfterViewInit {
  displayedColumns: string[] = [
    'saleId',
    'date',
    'customer',
    'items',
    'total',
    'paymentMethod',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);
  dateRange: 'day' | 'week' | 'month' = 'day';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private dialog: MatDialog) {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openNewSaleDialog() {
    const dialogRef = this.dialog.open(SalesFormComponent, {
      width: '800px',
      data: { mode: 'new' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Handle new sale
      }
    });
  }

  onDateRangeChange(range: 'day' | 'week' | 'month') {
    this.dateRange = range;
    // Filter data based on date range
  }

  exportSales() {
    // Export sales data to CSV/Excel
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }
}
