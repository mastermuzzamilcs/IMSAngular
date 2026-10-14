import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { StockService } from '../../../core/services/stock.service';
import { VendorService } from '../../../core/services/vendor.service';
import { ItemSearchModalComponent } from '../item-search-modal/item-search-modal.component';
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
  selector: 'app-stock-out',
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
  templateUrl: './stock-out.component.html',
  styleUrls: ['./stock-out.component.scss'],
})
export class StockOutComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly notice = inject(MxNoticeService);

  readonly privileges = privilegeAccess;
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [
    'product',
    'description',
    'quantity',
    'reason',
    'comments',
    'unitPrice',
    'discount',
    'total',
    'actions',
  ];
  stockOutForm!: FormGroup;
  vendors: any[] = [];
  stockDetails: any[] = [];

  subTotal = 0;
  discountType: 'amount' | 'percentage' = 'amount';
  discountValue = 0;
  netTotal = 0;

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private vendorService: VendorService,
    private _workflowService: WorkflowService,
    private _loadingService: LoadingService,
    private auth: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.stockOutForm = this.fb.group({
      vendor: ['', Validators.required],
      date: [new Date(), Validators.required],
    });

    this.vendors = await this.vendorService.getVendors();
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
              reason: '',
              Comments: '',
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

  async submitStockOut(): Promise<void> {
    const branch = this.auth.currentBranchId();
    if (!branch) {
      this.toast.warning('Choose a branch from the top bar before continuing.');
      return;
    }
    this._loadingService.show();
    if (this.stockOutForm.invalid || this.dataSource.data.length === 0) return;
    const payload = {
      ...this.stockOutForm.value,
      branch,
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
      const stock_id = await this.stockService.addStockEntity(payload);

      await this._workflowService.createRequest({
        moduleId: stock_id,
        requestType: RequestType.StockOut,
        requestedBy: this.auth.currentUserId(),
        branchId: this.auth.currentBranchId(),
        remarks: 'Auto‑generated from Stock‑Out screen',
      });
      this.toast.success('Stock-out entry added successfully');
      this.dataSource.data = [];
      this.stockOutForm.reset({ date: new Date() });
      this.subTotal = 0;
      this.discountType = 'amount';
      this.discountValue = 0;
      this.netTotal = 0;
    } catch (err) {
      console.error('Error submitting stock in:', err);
      this.toast.error('Failed to submit stock-in');
    }
    this._loadingService.hide();
  }
}
