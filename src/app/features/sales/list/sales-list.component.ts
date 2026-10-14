import { Component, AfterViewInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SalesFormComponent } from '../form/sales-form.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CommonModule } from '@angular/common';
import { MxBadgeComponent, MxButtonComponent, MxEmptyStateComponent, MxGridComponent, MxPageHeaderComponent, MxNoticeService } from '@mesix/custom-control';
import { Status } from '../../../core/enums/status.enum';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    MatPaginatorModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatButtonToggleModule,
    CommonModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxBadgeComponent,
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss'],
})
export class SalesListComponent implements AfterViewInit {
  private readonly notice = inject(MxNoticeService);

  readonly Status = Status;
  readonly privileges = privilegeAccess;
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

  constructor() {}

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

  openNewSaleDialog() {
    const dialogRef = this.notice.open(SalesFormComponent, {
      data: { mode: 'new' }
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
}

