import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
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
  MxDialogRef,
  MxEmptyStateComponent,
  MxGridComponent,
  MxNoticeService,
  MxPageHeaderComponent,
} from '@mesix/custom-control';
import { ItemSearchModalComponent } from '../../inventory/item-search-modal/item-search-modal.component';
import { UsersService } from '../../../core/services/users.service';
import { BranchService } from '../../../core/services/branchservice.service';
import { StockService } from '../../../core/services/stock.service';
import { TransferService } from '../../../core/services/transfer.service';
import { WorkflowService } from '../../../core/services/Workflow.service';
import { AuthService } from '../../../core/services/auth.service';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { LoadingService } from '../../../core/services/Loading.service';
import { Transfer } from '../../../core/Models/TransferModel';
import { Branch } from '../../../core/Models/BranchModel';
import { Product } from '../../../core/Models/ProductModel';
import { User } from '../../../core/Models/UsersModel';
import { RequestStatus, RequestType } from '../../../core/Models/WorkflowModel';
import {
  ALL_BRANCHES_ID,
  UserBranchAssociationService,
} from '../../../core/services/user-branch-association.service';
import { CustomerSearchModalComponent } from '../../../shared/components/customer-search-modal/customer-search-modal.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-new-transfer-request',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatIconModule,
    MatTableModule,
    MatNativeDateModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxCardComponent,
    MxGridComponent,
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './new-transfer-request.component.html',
  styleUrls: ['./new-transfer-request.component.scss'],
})
export class NewTransferRequestComponent implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly notice = inject(MxNoticeService);

  readonly privileges = privilegeAccess;
  dataSource = new MatTableDataSource<Product & { quantity: number }>([]);
  displayedColumns: string[] = ['product', 'description', 'quantity', 'actions'];
  transferForm!: FormGroup;
  branches: Branch[] = [];
  users: User[] = [];
  private linksByUser = new Map<string, string[]>();
  searchedUser: User | null = null;
  private itemDialogRef: MxDialogRef<Product | Product[] | null> | null = null;
  private addItemOpen = false;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private branchAssociationService: UserBranchAssociationService,
    private branchService: BranchService,
    private stockService: StockService,
    private transferService: TransferService,
    private workflowService: WorkflowService,
    private loadingService: LoadingService,
    private auth: AuthService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.transferForm = this.fb.group({
      toBranch: ['', Validators.required],
      user: ['', Validators.required],
      date: [new Date(), Validators.required],
    });

    const [users, branches, links] = await Promise.all([
      this.usersService.getUsers(),
      this.branchService.getBranches(),
      this.branchAssociationService.getAssociations(),
    ]);

    this.branches = branches;
    this.users = users;
    links.forEach((link) => {
      const current = this.linksByUser.get(link.userid) || [];
      current.push(link.branchid);
      this.linksByUser.set(link.userid, current);
    });
  }

  get userChoices(): User[] {
    const toBranch = this.transferForm?.get('toBranch')?.value || '';
    if (!toBranch) {
      return this.searchedUser ? [this.searchedUser] : [];
    }
    const fromBranch = this.auth.currentBranchId();
    const allowed = new Set([fromBranch, toBranch]);
    const choices = this.users.filter((user) => this.userServes(user.userid || '', allowed));
    if (
      this.searchedUser?.userid &&
      !choices.some((user) => user.userid === this.searchedUser?.userid)
    ) {
      choices.unshift(this.searchedUser);
    }
    return choices;
  }

  onToBranchChange(): void {
    const selected = this.transferForm.get('user')?.value || '';
    const toBranch = this.transferForm.get('toBranch')?.value || '';
    const allowed = new Set([this.auth.currentBranchId(), toBranch].filter((id) => id.length > 0));
    if (!this.userServes(selected, allowed)) {
      this.searchedUser = null;
      this.transferForm.patchValue({ user: '' });
    }
  }

  openUserSearch(): void {
    this.notice
      .open(CustomerSearchModalComponent, {
        data: { type: 'all', isMultiSelect: false },
      })
      .afterClosed()
      .subscribe((user: User | null) => {
        if (!user?.userid) {
          return;
        }
        this.searchedUser = user;
        if (!this.users.some((item) => item.userid === user.userid)) {
          this.users = [user, ...this.users];
        }
        this.transferForm.patchValue({ user: user.userid });
      });
  }

  private userServes(userid: string, branches: Set<string>): boolean {
    if (!userid || branches.size === 0) {
      return false;
    }
    const links = this.linksByUser.get(userid) || [];
    return links.some((branchid) => branchid === ALL_BRANCHES_ID || branches.has(branchid));
  }

  get destinationBranches(): Branch[] {
    const current = this.auth.currentBranchId();
    return this.branches.filter((branch) => branch.branchid !== current);
  }

  async openProductDialog(): Promise<void> {
    if (this.addItemOpen) {
      return;
    }
    this.addItemOpen = true;

    try {
      const branchId = this.auth.currentBranchId();
      const allowedIds = new Set<string>();
      if (branchId) {
        const stock = await this.stockService.getStockOverviewByBranch(branchId);
        stock
          .filter((item) => Number(item.balanceQuantity ?? item.quantity) > 0)
          .forEach((item) => allowedIds.add(item.productid));
      }

      this.itemDialogRef = this.notice.open(ItemSearchModalComponent, {
        data: {},
      });

      this.itemDialogRef.afterClosed().subscribe((result) => {
        this.itemDialogRef = null;
        this.addItemOpen = false;
        if (Array.isArray(result) && result.length) {
          const updatedData = [...this.dataSource.data];
          result.forEach((product) => {
            if (!product.id || !allowedIds.has(product.id)) {
              return;
            }
            const existing = updatedData.find((item) => item.id === product.id);
            if (!existing) {
              updatedData.push({
                ...product,
                quantity: 1,
              });
            }
          });

          this.dataSource.data = updatedData;
        }
      });
    } catch (error) {
      this.itemDialogRef = null;
      this.addItemOpen = false;
      console.error('Error opening item search', error);
    }
  }

  removeProduct(row: Product & { quantity: number }): void {
    this.dataSource.data = this.dataSource.data.filter((item) => item !== row);
  }

  async submitTransfer(): Promise<void> {
    const fromBranchId = this.auth.currentBranchId();
    if (!fromBranchId) {
      this.toast.warning('Choose a branch from the top bar before continuing.');
      return;
    }
    if (this.transferForm.invalid || this.dataSource.data.length === 0) {
      return;
    }

    this.loadingService.show();
    const formValue = this.transferForm.value;
    const fromBranch = this.branches.find((item) => item.branchid === fromBranchId);
    const toBranch = this.branches.find((item) => item.branchid === formValue.toBranch);
    const user = this.users.find((item) => item.userid === formValue.user);

    const transfer: Transfer = {
      fromBranch: fromBranchId,
      fromBranchName: fromBranch?.name || '',
      branchId: fromBranchId,
      branchName: fromBranch?.name || '',
      userId: formValue.user,
      userName: user?.name || '',
      toBranch: formValue.toBranch,
      toBranchName: toBranch?.name || '',
      expectedDate: formValue.date,
      requestDate: new Date(),
      status: RequestStatus.Pending,
      items: this.dataSource.data.map((row) => ({
        productId: row.id || '',
        productName: row.name,
        description: row.description || '',
        quantity: Number(row.quantity) || 0,
      })),
    };

    try {
      const transferId = await this.transferService.addTransfer(transfer);
      await this.workflowService.createRequest({
        moduleId: transferId,
        requestType: RequestType.Transfer,
        requestedBy: this.auth.currentUserId(),
        branchId: fromBranchId,
        toBranchId: formValue.toBranch,
        remarks: 'Auto-generated from New Transfer Request',
      });
      this.toast.success('Transfer request added successfully');
      this.dataSource.data = [];
      this.transferForm.reset({ date: new Date() });
    } catch (err) {
      console.error('Error submitting transfer request:', err);
      this.toast.error(err instanceof Error ? err.message : 'Failed to submit transfer request');
    }
    this.loadingService.hide();
  }
}
