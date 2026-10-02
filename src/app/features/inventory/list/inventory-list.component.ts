import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { StockService } from '../../../core/services/stock.service';
import { BranchService } from '../../../core/services/branchservice.service';
import { VendorService } from '../../../core/services/vendor.service';
import { ProductService } from '../../../core/services/product.service';
import { Stock, StockOverview } from '../../../core/Models/StockModel';
import { Branch } from '../../../core/Models/BranchModel';
import { LoadingService } from '../../../core/services/Loading.service';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    RouterModule,
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
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadingService.show();
    this.branches = await this.branchService.getBranches();
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
    this.dataSource.filter = filterValue.trim().toLowerCase();
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
