import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
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
import { ItemSearchModalComponent } from '../../inventory/item-search-modal/item-search-modal.component';
import { UsersService } from '../../../core/services/users.service';
import { BranchService } from '../../../core/services/branchservice.service';
import { StockService } from '../../../core/services/stock.service';
import { TransferService } from '../../../core/services/transfer.service';
import { WorkflowService } from '../../../core/services/Workflow.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { Transfer } from '../../../core/Models/TransferModel';
import { RequestStatus, RequestType } from '../../../core/Models/WorkflowModel';

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
    MatButtonModule,
    MatCardModule,
    MatNativeDateModule,
  ],
  templateUrl: './new-transfer-request.component.html',
  styleUrls: ['./new-transfer-request.component.scss'],
})
export class NewTransferRequestComponent implements OnInit {
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['product', 'description', 'quantity', 'actions'];
  transferForm!: FormGroup;
  branches: any[] = [];
  users: any[] = [];
  private itemDialogRef: MatDialogRef<ItemSearchModalComponent> | null = null;
  private addItemOpen = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private usersService: UsersService,
    private branchService: BranchService,
    private stockService: StockService,
    private transferService: TransferService,
    private workflowService: WorkflowService,
    private loadingService: LoadingService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.transferForm = this.fb.group({
      branch: ['', Validators.required],
      user: ['', Validators.required],
      date: [new Date(), Validators.required],
    });

    const [users, branches] = await Promise.all([
      this.usersService.getUsers(),
      this.branchService.getBranches(),
    ]);

    this.branches = branches;
    this.users = users
      .filter((user) => !!user.branchid)
      .map((user) => ({
        ...user,
        branchName: branches.find((branch) => branch.branchid === user.branchid)?.name || '',
      }));
  }

  get usersForBranch(): any[] {
    const branchId = this.transferForm?.get('branch')?.value;
    if (!branchId) {
      return this.users;
    }
    return this.users.filter((user) => user.branchid !== branchId);
  }

  onBranchChange(): void {
    this.dataSource.data = [];
    const branchId = this.transferForm.get('branch')?.value;
    const selectedUser = this.users.find(
      (user) => user.userid === this.transferForm.get('user')?.value,
    );
    if (selectedUser && selectedUser.branchid === branchId) {
      this.transferForm.patchValue({ user: '' });
    }
  }

  async openProductDialog(): Promise<void> {
    if (this.addItemOpen) {
      return;
    }
    this.addItemOpen = true;

    try {
      const branchId = this.transferForm.get('branch')?.value;
      const allowedIds = new Set<string>();
      if (branchId) {
        const stock = await this.stockService.getStockOverviewByBranch(branchId);
        stock
          .filter((item) => Number(item.balanceQuantity ?? item.quantity) > 0)
          .forEach((item) => allowedIds.add(item.productid));
      }

      this.itemDialogRef = this.dialog.open(ItemSearchModalComponent, {
        width: '800px',
        data: {},
      });

      this.itemDialogRef.afterClosed().subscribe((result) => {
        this.itemDialogRef = null;
        this.addItemOpen = false;
        if (Array.isArray(result) && result.length) {
          const updatedData = [...this.dataSource.data];
          result.forEach((product) => {
            if (!allowedIds.has(product.id)) {
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

  removeProduct(row: any): void {
    this.dataSource.data = this.dataSource.data.filter((item) => item !== row);
  }

  async submitTransfer(): Promise<void> {
    if (this.transferForm.invalid || this.dataSource.data.length === 0) {
      return;
    }

    this.loadingService.show();
    const formValue = this.transferForm.value;
    const branch = this.branches.find((item) => item.branchid === formValue.branch);
    const user = this.users.find((item) => item.userid === formValue.user);

    const transfer: Transfer = {
      fromBranch: formValue.branch,
      fromBranchName: branch?.name || '',
      branchId: formValue.branch,
      branchName: branch?.name || '',
      userId: formValue.user,
      userName: user?.name || '',
      toBranch: user?.branchid || '',
      toBranchName: user?.branchName || '',
      expectedDate: formValue.date,
      requestDate: new Date(),
      status: RequestStatus.Pending,
      items: this.dataSource.data.map((row) => ({
        productId: row.id,
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
        requestedBy: 'currentUserUid',
        remarks: 'Auto-generated from New Transfer Request',
      });
      alert('Transfer request added successfully');
      this.dataSource.data = [];
      this.transferForm.reset({ date: new Date() });
    } catch (err) {
      console.error('Error submitting transfer request:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit transfer request');
    }
    this.loadingService.hide();
  }
}
