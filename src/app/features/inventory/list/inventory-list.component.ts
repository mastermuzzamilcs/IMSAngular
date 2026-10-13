import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
  MxSelectComponent,
  MxSelectOption,
} from '@mesix/custom-control';
import type { MxTone } from '@mesix/custom-control';
import { StockService } from '../../../core/services/stock.service';
import { BranchService } from '../../../core/services/branchservice.service';
import { VendorService } from '../../../core/services/vendor.service';
import { ProductService } from '../../../core/services/product.service';
import { Stock, StockOverview } from '../../../core/Models/StockModel';
import { Branch } from '../../../core/Models/BranchModel';
import { LoadingService } from '../../../core/services/Loading.service';

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
    MxSelectComponent,
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
  dataSource = new MatTableDataSource<any>([]);
  branches: Branch[] = [];
  branchOptions: MxSelectOption[] = [];
  selectedBranchId: string = '';
  allStock: Stock[] = [];
  stockOverviewData: StockOverview[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private stockService: StockService,
    private branchService: BranchService,
    private vendorService: VendorService,
    private productService: ProductService,
    private loadingService: LoadingService,
    private router: Router,
  ) {}

  goStockIn(): void {
    this.router.navigate(['/inventory/stock-in']);
  }

  goStockOut(): void {
    this.router.navigate(['/inventory/stock-out']);
  }

  async ngOnInit(): Promise<void> {
    this.loadingService.show();
    this.branches = await this.branchService.getBranches();
    this.branchOptions = this.branches.map((b) => ({
      value: b.branchid || '',
      label: b.name,
    }));
    const loggedInBranchId = '3nMj9NbLzWPwiqDAsOWn';
    this.selectedBranchId = loggedInBranchId;
    await this.filterByBranch();
    this.loadingService.hide();
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

  onBranchChange(branchId: string): void {
    this.selectedBranchId = branchId;
    void this.filterByBranch();
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
    this.loadingService.show();
    if (!this.selectedBranchId) return;

    this.stockOverviewData = await this.stockService.getStockOverviewByBranch(
      this.selectedBranchId,
    );
    this.stockOverviewData.forEach((item) => {
      const onHand = item.balanceQuantity ?? item.quantity;
      item.alert = onHand <= 0 ? 'Empty' : onHand < 5 ? 'Low' : 'Healthy';
    });

    this.dataSource.data = this.stockOverviewData;
    this.loadingService.hide();
  }
}
