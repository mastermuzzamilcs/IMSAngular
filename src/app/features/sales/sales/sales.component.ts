import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { StockService } from '../../../core/services/stock.service';
import { CustomerService } from '../../../core/services/customer.service';
import { BranchService } from '../../../core/services/branchservice.service';
import { ItemSearchModalComponent } from '../item-search-modal/item-search-modal.component';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { WorkflowService } from '../../../core/services/Workflow.service';
import { RequestType } from '../../../core/Models/WorkflowModel';
import { LoadingService } from '../../../core/services/Loading.service';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatNativeDateModule,
    FormsModule,
  ],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss'],
})
export class SalesComponent implements OnInit {
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [
    'product',
    'description',
    'quantity',
    'unitPrice',
    'discount',
    'total',
    'actions',
  ];
  salesForm!: FormGroup;
  branches: any[] = [];
  customers: any[] = [];
  saleDetails: any[] = [];

  subTotal = 0;
  discountType: 'amount' | 'percentage' = 'amount';
  discountValue = 0;
  netTotal = 0;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private stockService: StockService,
    private customerService: CustomerService,
    private branchService: BranchService,
    private _workflowService: WorkflowService,
    private _loadingService: LoadingService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.salesForm = this.fb.group({
      branch: ['', Validators.required],
      customer: ['', Validators.required],
      date: [new Date(), Validators.required],
    });

    this.branches = await this.branchService.getBranches();
    this.customers = await this.customerService.getCustomers();
  }

  openProductDialog(): void {
    const dialogRef = this.dialog.open(ItemSearchModalComponent, {
      width: '800px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (Array.isArray(result) && result.length) {
        const updatedData = [...this.dataSource.data];

        result.forEach((product) => {
          const existing = updatedData.find((item) => item.id === product.id);

          if (!existing) {
            updatedData.push({
              ...product,
              quantity: 1,
              unitPrice: product.price || 0,
              discount: 0,
              total: product.price || 0,
            });
          }
        });

        this.dataSource.data = updatedData;
        this.recalculateTotal();
      }
    });
  }

  updateRowTotal(row: any): void {
    const quantity = Number(row.quantity) || 0;
    const unitPrice = Number(row.unitPrice) || 0;
    const discount = Number(row.discount) || 0;

    row.total = quantity * unitPrice - discount;

    this.recalculateTotal();
  }

  recalculateTotal(): void {
    this.subTotal = this.dataSource.data.reduce((sum, item) => sum + (item.total || 0), 0);

    const discount =
      this.discountType === 'percentage'
        ? (this.subTotal * (Number(this.discountValue) || 0)) / 100
        : Number(this.discountValue) || 0;

    this.netTotal = this.subTotal - discount;
  }

  removeProduct(row: any): void {
    this.dataSource.data = this.dataSource.data.filter((item) => item !== row);
    this.recalculateTotal();
  }

  async submitSale(): Promise<void> {
    if (this.salesForm.invalid || this.dataSource.data.length === 0) {
      return;
    }

    this._loadingService.show();

    const payload = {
      ...this.salesForm.value,
      stockItems: this.dataSource.data,
      TotalItems: this.dataSource.data.length,
      SubTotal: this.subTotal,
      DiscountType: this.discountType,
      DiscountValue: this.discountValue,
      NetTotal: this.netTotal,
      status: 'Pending',
      stocktype: 'out',
    };

    try {
      const sale_id = await this.stockService.addStockEntity(payload);

      await this._workflowService.createRequest({
        moduleId: sale_id,
        requestType: RequestType.Sales,
        requestedBy: 'currentUserUid',
        remarks: 'Auto-generated from Sales screen',
      });

      alert('Sale entry added successfully');

      this.dataSource.data = [];
      this.salesForm.reset({ date: new Date() });

      this.subTotal = 0;
      this.discountType = 'amount';
      this.discountValue = 0;
      this.netTotal = 0;
    } catch (err) {
      console.error('Error submitting sale:', err);
      alert('Failed to submit sale');
    }

    this._loadingService.hide();
  }
}
