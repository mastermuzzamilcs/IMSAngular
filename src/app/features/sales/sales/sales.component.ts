import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Customer } from '../../../core/Models/CustomerModel';
import { StockLineItem } from '../../../core/Models/StockModel';
import { StockService } from '../../../core/services/stock.service';
import { ItemSearchModalComponent } from '../item-search-modal/item-search-modal.component';
import { CustomerSearchModalComponent } from '../../../shared/components/customer-search-modal/customer-search-modal.component';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatNativeDateModule } from '@angular/material/core';
import {
  MxButtonComponent,
  MxCardComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxNoticeService,
  MxPageHeaderComponent,
} from '@mesix/custom-control';
import { WorkflowService } from '../../../core/services/Workflow.service';
import { Status } from '../../../core/enums/status.enum';
import { RequestType } from '../../../core/Models/WorkflowModel';
import { LoadingService } from '../../../core/services/Loading.service';
import { AuthService } from '../../../core/services/auth.service';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';

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
    MatNativeDateModule,
    FormsModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxCardComponent,
    MxGridComponent,
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss'],
})
export class SalesComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly notice = inject(MxNoticeService);

  readonly privileges = privilegeAccess;
  dataSource = new MatTableDataSource<StockLineItem>([]);
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
  saleDetails: StockLineItem[] = [];
  private linkedCustomer: Customer | null = null;

  subTotal = 0;
  discountType: 'amount' | 'percentage' = 'amount';
  discountValue = 0;
  netTotal = 0;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private _workflowService: WorkflowService,
    private _loadingService: LoadingService,
    private auth: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.salesForm = this.fb.group({
      customerId: [''],
      customerName: ['', Validators.required],
      customerPhone: [''],
      customerEmail: ['', Validators.email],
      customerAddress: [''],
      date: [new Date(), Validators.required],
    });
  }

  openCustomerDialog(): void {
    const dialogRef = this.notice.open(CustomerSearchModalComponent, {
      data: { type: 'Customers', isMultiSelect: false },
    });

    dialogRef.afterClosed().subscribe((customer: Customer | null) => {
      if (!customer) {
        return;
      }
      this.linkedCustomer = customer;
      this.salesForm.patchValue({
        customerId: customer.id || '',
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        customerAddress: customer.address,
      });
    });
  }

  openProductDialog(): void {
    const dialogRef = this.notice.open(ItemSearchModalComponent, {
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

  updateRowTotal(row: StockLineItem): void {
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

  removeProduct(row: StockLineItem): void {
    this.dataSource.data = this.dataSource.data.filter((item) => item !== row);
    this.recalculateTotal();
  }

  async submitSale(): Promise<void> {
    if (this.salesForm.invalid || this.dataSource.data.length === 0) {
      this.salesForm.markAllAsTouched();
      return;
    }

    const branch = this.auth.currentBranchId();
    if (!branch) {
      this.toast.warning('Choose a branch from the top bar before continuing.');
      return;
    }

    this._loadingService.show();

    const payload = {
      ...this.salesForm.value,
      branch,
      customerId: this.selectedCustomerId(),
      stockItems: this.dataSource.data,
      TotalItems: this.dataSource.data.length,
      SubTotal: this.subTotal,
      DiscountType: this.discountType,
      DiscountValue: this.discountValue,
      NetTotal: this.netTotal,
      status: Status.Pending,
      stocktype: 'out',
    };

    try {
      const sale_id = await this.stockService.addStockEntity(payload);

      await this._workflowService.createRequest({
        moduleId: sale_id,
        requestType: RequestType.Sales,
        requestedBy: this.auth.currentUserId(),
        branchId: this.auth.currentBranchId(),
        remarks: 'Auto-generated from Sales screen',
      });

      this.toast.success('Sale entry added successfully');

      this.dataSource.data = [];
      this.linkedCustomer = null;
      this.salesForm.reset({
        date: new Date(),
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
      });

      this.subTotal = 0;
      this.discountType = 'amount';
      this.discountValue = 0;
      this.netTotal = 0;
    } catch (err) {
      console.error('Error submitting sale:', err);
      this.toast.error('Failed to submit sale');
    }

    this._loadingService.hide();
  }

  private selectedCustomerId(): string {
    const value = this.salesForm.value;
    const linked = this.linkedCustomer;
    if (!linked?.id) {
      return '';
    }
    const unchanged =
      value.customerName === linked.name &&
      value.customerPhone === linked.phone &&
      value.customerEmail === linked.email &&
      value.customerAddress === linked.address;
    return unchanged ? linked.id : '';
  }
}
