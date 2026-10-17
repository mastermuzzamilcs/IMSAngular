import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { CommonModule } from '@angular/common';
import { AppCurrencyPipe } from '../../../core/pipes/app-currency.pipe';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
} from '@mesix/custom-control';
import { Status } from '../../../core/enums/status.enum';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';

interface SalesListRow {
  saleId: string;
  date: Date | string;
  customer: string;
  items: unknown[];
  total: number;
  paymentMethod: string;
  status: Status;
}

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
    AppCurrencyPipe,
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
  dataSource = new MatTableDataSource<SalesListRow>([]);
  dateRange: 'day' | 'week' | 'month' = 'day';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private readonly router: Router) {}

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

  openNewSale(): void {
    void this.router.navigateByUrl('/sales/sales');
  }

  onDateRangeChange(range: 'day' | 'week' | 'month') {
    this.dateRange = range;
    // Filter data based on date range
  }
}
