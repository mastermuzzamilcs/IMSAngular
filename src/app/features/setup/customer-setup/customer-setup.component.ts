import { ConfirmService } from '../../../core/services/confirm.service';
import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
  MxNoticeService,
} from '@mesix/custom-control';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { Customer } from '../../../core/Models/CustomerModel';
import { CustomerService } from '../../../core/services/customer.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { CustomerFormComponent } from '../customer-form/customer-form.component';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-customer-setup',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxBadgeComponent,
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './customer-setup.component.html',
})
export class CustomerSetupComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);
  private readonly confirm = inject(ConfirmService);

  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['name', 'phone', 'email', 'address', 'status', 'actions'];
  dataSource = new MatTableDataSource<Customer>([]);
  tableLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private customerService: CustomerService,
    private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  async loadCustomers(): Promise<void> {
    this.tableLoading = true;
    try {
      this.dataSource.data = await this.customerService.getCustomers(true);
    } catch (err) {
      console.error('Error loading customers', err);
      this.toast.error('Error loading customers');
    }
    this.tableLoading = false;
  }

  openAddDialog(): void {
    const dialogRef = this.notice.open(CustomerFormComponent, {
      data: { mode: 'add' },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }
      this.loadingService.show();
      await this.customerService.addCustomer(result);
      this.loadingService.hide();
      this.loadCustomers();
    });
  }

  openEditDialog(customer: Customer): void {
    const dialogRef = this.notice.open(CustomerFormComponent, {
      data: { mode: 'edit', customer },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result || !customer.id) {
        return;
      }
      this.loadingService.show();
      await this.customerService.updateCustomer({ ...result, id: customer.id });
      this.loadingService.hide();
      this.loadCustomers();
    });
  }

  openDeleteDialog(customer: Customer): void {
    this.confirm
      .confirmDelete(`Are you sure you want to delete "${customer.name}"?`, 'Delete Customer')
      .subscribe(async (result) => {
        if (result && customer.id) {
          this.loadingService.show();
          await this.customerService.deleteCustomer(customer.id);
          this.loadingService.hide();
          this.loadCustomers();
        }
      });
  }
}
