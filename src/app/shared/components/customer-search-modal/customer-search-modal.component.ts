import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { Customer } from '../../../core/Models/CustomerModel';
import { User } from '../../../core/Models/UsersModel';
import { CustomerService } from '../../../core/services/customer.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { UsersService } from '../../../core/services/users.service';

export type DirectorySearchType = 'Customers' | 'all';

export interface DirectorySearchData {
  type: DirectorySearchType;
  isMultiSelect: boolean;
  selectedIds?: string[];
}

interface DirectoryRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  source: Customer | User;
}

@Component({
  selector: 'app-customer-search-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTableModule,
  ],
  templateUrl: './customer-search-modal.component.html',
})
export class CustomerSearchModalComponent implements OnInit {
  searchForm: FormGroup;
  rows: DirectoryRow[] = [];
  private readonly selected = new Map<string, DirectoryRow>();
  private readonly initialIds: string[];
  readonly type: DirectorySearchType;
  readonly isMultiSelect: boolean;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private usersService: UsersService,
    private loadingService: LoadingService,
    public dialogRef: MatDialogRef<CustomerSearchModalComponent>,
    @Inject(MAT_DIALOG_DATA) data: DirectorySearchData | null,
  ) {
    this.type = data?.type || 'Customers';
    this.isMultiSelect = data?.isMultiSelect === true;
    this.initialIds = (data?.selectedIds || []).filter((id) => id.length > 0);
    this.searchForm = this.fb.group({
      name: [''],
      phone: [''],
      email: [''],
    });
  }

  get title(): string {
    return this.type === 'Customers' ? 'Search Customer' : 'Search Users';
  }

  get emptyLabel(): string {
    return this.type === 'Customers' ? 'No customers found.' : 'No users found.';
  }

  get displayedColumns(): string[] {
    const columns =
      this.type === 'Customers' ? ['name', 'phone', 'email', 'address'] : ['name', 'email'];
    return this.isMultiSelect ? ['select', ...columns] : [...columns, 'actions'];
  }

  async ngOnInit(): Promise<void> {
    if (!this.initialIds.length) {
      return;
    }
    const ids = new Set(this.initialIds);
    if (this.type === 'Customers') {
      const customers = await this.customerService.getCustomers();
      customers
        .filter((customer) => customer.id && ids.has(customer.id))
        .forEach((customer) => this.remember(this.customerRow(customer)));
      return;
    }
    const users = await this.usersService.getUsers();
    users
      .filter((user) => user.userid && ids.has(user.userid))
      .forEach((user) => this.remember(this.userRow(user)));
  }

  async search(): Promise<void> {
    this.loadingService.show();
    try {
      const filters = this.searchForm.value;
      if (this.type === 'Customers') {
        const customers = await this.customerService.searchCustomers(
          filters.name,
          filters.phone,
          filters.email,
        );
        this.rows = customers.map((customer) => this.customerRow(customer));
      } else {
        const users = await this.usersService.searchUsers(filters.name, filters.email);
        this.rows = users.map((user) => this.userRow(user));
      }
    } finally {
      this.loadingService.hide();
    }
  }

  isSelected(row: DirectoryRow): boolean {
    return this.selected.has(row.id);
  }

  toggle(row: DirectoryRow): void {
    if (this.selected.has(row.id)) {
      this.selected.delete(row.id);
      return;
    }
    this.remember(row);
  }

  choose(row: DirectoryRow): void {
    if (this.isMultiSelect) {
      this.toggle(row);
      return;
    }
    this.dialogRef.close(row.source);
  }

  confirm(): void {
    this.dialogRef.close([...this.selected.values()].map((row) => row.source));
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  private remember(row: DirectoryRow): void {
    this.selected.set(row.id, row);
  }

  private customerRow(customer: Customer): DirectoryRow {
    return {
      id: customer.id || '',
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      source: customer,
    };
  }

  private userRow(user: User): DirectoryRow {
    return {
      id: user.userid || '',
      name: user.name,
      phone: '',
      email: user.email,
      address: '',
      source: user,
    };
  }
}
