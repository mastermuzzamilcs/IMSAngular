import { Component, DestroyRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
} from '@mesix/custom-control';
import type { MxTone } from '@mesix/custom-control';
import { StockService } from '../../../core/services/stock.service';
import { VendorService } from '../../../core/services/vendor.service';
import { ProductService } from '../../../core/services/product.service';
import { Stock, StockOverview } from '../../../core/Models/StockModel';
import { LoadingService } from '../../../core/services/Loading.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    CommonModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxBadgeComponent,
    MxEmptyStateComponent,
  ],
  styleUrls: ['./inventory-list.component.scss'],
})
export class InventoryListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'branchName',
    'productName',
    'brand',
    'description',
    'price',
    'quantity',
    'balanceQuantity',
    'reservedQuantity',
    'alert',
  ];
  dataSource = new MatTableDataSource<StockOverview>([]);
  tableLoading = false;
  selectedBranchId = '';
  allStock: Stock[] = [];
  stockOverviewData: StockOverview[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private stockService: StockService,
    private vendorService: VendorService,
    private productService: ProductService,
    private loadingService: LoadingService,
    private auth: AuthService,
    private destroyRef: DestroyRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.auth.session$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((session) => {
      const next = session?.branchid || '';
      if (next === this.selectedBranchId) {
        return;
      }
      this.selectedBranchId = next;
      void this.filterByBranch();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.onGridFilter(filterValue);
  }

  onGridFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  goStockIn(): void {
    void this.router.navigate(['/inventory/stock-in']);
  }

  goStockOut(): void {
    void this.router.navigate(['/inventory/stock-out']);
  }

  getAlertTone(alert: string): MxTone {
    switch (alert) {
      case 'Empty':
        return 'danger';
      case 'Low':
        return 'warning';
      case 'Healthy':
        return 'success';
      default:
        return 'neutral';
    }
  }

  async filterByBranch(): Promise<void> {
    if (!this.selectedBranchId) {
      this.dataSource.data = [];
      this.tableLoading = false;
      return;
    }
    this.tableLoading = true;
    try {
      this.stockOverviewData = await this.stockService.getStockOverviewByBranch(
        this.selectedBranchId,
      );
      this.stockOverviewData.forEach((item) => {
        const onHand = item.balanceQuantity ?? item.quantity;
        item.alert = onHand <= 0 ? 'Empty' : onHand < 5 ? 'Low' : 'Healthy';
      });
      this.dataSource.data = this.stockOverviewData;
    } finally {
      this.tableLoading = false;
    }
  }
}
