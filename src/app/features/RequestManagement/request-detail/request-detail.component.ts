import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxDialogRef,
  MX_DIALOG_DATA,
} from '@mesix/custom-control';

import { AuthService } from '../../../core/services/auth.service';
import { WorkflowService } from '../../../core/services/Workflow.service';
import { StockService } from '../../../core/services/stock.service';
import { Stock, StockDetails } from '../../../core/Models/StockModel';
import { RequestStatus, RequestType, WorkflowRequest } from '../../../core/Models/WorkflowModel';
import { WorkflowTransitionOption } from '../../../core/Models/WorkflowStatusTransition';
import { WorkflowTransitionService } from '../../../core/services/workflow-transition.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../../core/services/product.service';
import { TransferService } from '../../../core/services/transfer.service';
import { Transfer, TransferItem } from '../../../core/Models/TransferModel';
import { UsersService } from '../../../core/services/users.service';
import { SYSTEM_USER_ID } from '../../../core/system-user';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.scss'],
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    FormsModule,
    MatProgressSpinnerModule,
    MxButtonComponent,
    MxBadgeComponent,
  ],
})
export class RequestDetailComponent implements OnInit {
  private readonly toast = inject(ToastService);

  /** ---- Data coming from parent ---- */
  constructor(
    private dialogRef: MxDialogRef<unknown>,
    @Inject(MX_DIALOG_DATA) public data: { requestId: string },
    private wfSvc: WorkflowService,
    private stockSvc: StockService,
    private _productService: ProductService,
    private transferSvc: TransferService,
    private transitionService: WorkflowTransitionService,
    private auth: AuthService,
    private usersService: UsersService,
  ) {}

  // UI state
  loading = true;
  request!: WorkflowRequest;
  stockHdr: Stock | null = null;
  stockRows: StockDetails[] = [];
  isTransfer = false;
  transfer: Transfer | null = null;
  transferRows: TransferItem[] = [];
  transferColumns = ['transferProduct', 'transferDescription', 'transferQty'];

  /** Approval form */
  action: RequestStatus | '' = '';
  remarks = '';
  submitting = false;
  canAct = false;
  actionBlockedReason = '';
  assignedToName = '';

  displayedColumns = ['product', 'qty', 'price', 'disc', 'total'];
  actions: WorkflowTransitionOption[] = [];

  get showApproval(): boolean {
    return this.actions.length > 0 && this.canAct;
  }

  get displayedRequestId(): string | undefined {
    return this.request?.requestId;
  }

  get displayedRequestStatus(): RequestStatus | undefined {
    return this.request?.status;
  }

  get showApprovalBlocked(): boolean {
    return this.actions.length > 0 && !this.canAct;
  }

  get transferDate(): Date | null {
    const value = this.transfer?.expectedDate;
    if (!value) {
      return null;
    }
    if (typeof value === 'object' && !(value instanceof Date)) {
      return value.toDate();
    }
    return value instanceof Date ? value : new Date(value);
  }

  async ngOnInit(): Promise<void> {
    this.request = (await this.wfSvc.getById(this.data.requestId))!;
    this.isTransfer = this.request.requestType === RequestType.Transfer;
    if (this.isTransfer) {
      this.transfer = await this.transferSvc.getTransferById(this.request.moduleId);
      this.transferRows = this.transfer?.items || [];
    } else {
      this.stockHdr = await this.stockSvc.getStockById(this.request.moduleId);
      this.stockRows = await this.stockSvc.getStockDetails(this.request.moduleId);
    }
    const status = this.isTransfer
      ? this.transfer?.status || this.request.status
      : this.request.status;
    this.actions = await this.transitionService.getNext(this.request.requestType, status);
    this.assignedToName = await this.resolveUserName(this.request.assignedTo || '');
    this.canAct = await this.wfSvc.canCurrentUserAct(this.request, this.auth.currentUserId());
    if (!this.canAct && this.actions.length > 0) {
      if (!this.request.assignedTo) {
        this.actionBlockedReason = 'This request has no assigned user, so no action can be taken.';
      } else if (this.request.assignedTo !== this.auth.currentUserId()) {
        this.actionBlockedReason = `Only the assigned user (${this.assignedToName || this.request.assignedTo}) can act on this request.`;
      } else if (!this.auth.canApproveRequests()) {
        this.actionBlockedReason = 'Your group is not allowed to approve requests.';
      } else {
        this.actionBlockedReason = 'You are not authorized to act on this request.';
      }
    }
    this.loading = false;
  }

  private async resolveUserName(userId: string): Promise<string> {
    if (!userId) {
      return '';
    }
    if (userId === SYSTEM_USER_ID) {
      return 'system';
    }
    const users = await this.usersService.getUsers();
    return users.find((user) => user.userid === userId)?.name || userId;
  }

  /** Submit approve / reject */
  async submit(): Promise<void> {
    if (!this.action || !this.request.requestId) return;
    this.submitting = true;
    try {
      const status = this.action as RequestStatus;
      await this.wfSvc.updateStatus(
        this.request.requestId,
        status,
        this.auth.currentUserId(),
        this.remarks,
      );
      this.dialogRef.close({ updated: true });
    } catch (err) {
      console.error('Error updating workflow request:', err);
      this.toast.error(err instanceof Error ? err.message : 'Failed to update request');
    }
    this.submitting = false;
  }
}
