import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
} from '@mesix/custom-control';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Customer } from '../../../core/Models/CustomerModel';
import { CustomerService } from '../../../core/services/customer.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { GlobalDeleteConfirmationComponent } from '../../../shared/components/global-delete-confirmation/global-delete-confirmation.component';
import { CustomerFormComponent } from '../customer-form/customer-form.component';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';

@Component({
  selector: 'app-customer-setup',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
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
  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['name', 'phone', 'email', 'address', 'status', 'actions'];
  dataSource = new MatTableDataSource<Customer>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private customerService: CustomerService,
    private loadingService: LoadingService,
    private dialog: MatDialog,
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
    this.loadingService.show();
    try {
      this.dataSource.data = await this.customerService.getCustomers(true);
    } catch (err) {
      console.error('Error loading customers', err);
      alert('Error loading customers');
    }
    this.loadingService.hide();
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(CustomerFormComponent, {
      width: '520px',
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
    const dialogRef = this.dialog.open(CustomerFormComponent, {
      width: '520px',
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
    const dialogRef = this.dialog.open(GlobalDeleteConfirmationComponent, {
      width: '320px',
      data: {
        title: 'Delete Customer',
        message: `Are you sure you want to delete "${customer.name}"?`,
      },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && customer.id) {
        this.loadingService.show();
        await this.customerService.deleteCustomer(customer.id);
        this.loadingService.hide();
        this.loadCustomers();
      }
    });
  }
}
