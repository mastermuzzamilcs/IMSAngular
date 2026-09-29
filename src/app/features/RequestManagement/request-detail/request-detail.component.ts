import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';

import { WorkflowService } from '../../../core/services/Workflow.service';
import { StockService } from '../../../core/services/stock.service';
import { StockDetails } from '../../../core/Models/StockModel';
import { WorkflowRequest } from '../../../core/Models/WorkflowModel';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    FormsModule,
    MatProgressSpinnerModule,
  ],
})
export class RequestDetailComponent implements OnInit {
  /** ---- Data coming from parent ---- */
  constructor(
    private dialogRef: MatDialogRef<RequestDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { requestId: string },
    private wfSvc: WorkflowService,
    private stockSvc: StockService,
    private _productService: ProductService,
  ) {}

  // UI state
  loading = true;
  request!: WorkflowRequest;
  stockHdr: any;
  stockRows: StockDetails[] = [];

  /** Approval form */
  action: '' | 'Approved' | 'Rejected' = '';
  remarks = '';
  submitting = false;

  displayedColumns = ['product', 'qty', 'price', 'disc', 'total'];

  async ngOnInit(): Promise<void> {
    this.request = (await this.wfSvc.getById(this.data.requestId))!;
    this.stockHdr = await this.stockSvc.getStockById(this.request.moduleId);
    this.stockRows = await this.stockSvc.getStockDetails(this.request.moduleId);
    this.loading = false;
  }

  /** Submit approve / reject */
  async submit(): Promise<void> {
    if (!this.action) return;
    this.submitting = true;
    if (this.action === 'Approved') {
      await this.wfSvc.approve(
        this.request.requestId!,
        this.stockHdr.stockid,
        this.stockHdr.branchid,
        'admin',
        this.request.requestType,
        this.remarks,
      );
    } else {
      await this.wfSvc.reject(
        this.request.requestId!,
        this.stockHdr.stockid,
        this.stockHdr.branchid,
        'admin',
        this.request.requestType,
        this.remarks,
      );
    }
    this.submitting = false;
    this.dialogRef.close({ updated: true });
  }
}
