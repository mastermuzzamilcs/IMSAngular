import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';

import { StockService } from '../../../core/services/stock.service';
import { BranchService } from '../../../core/services/branchservice.service';
import { Branch } from '../../../core/Models/BranchModel';

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './transfer-form.component.html',
  styleUrls: ['./transfer-form.component.scss'],
})
export class TransferFormComponent implements OnInit {
  transferForm!: FormGroup;

  availableLaptops: any[] = [];
  filteredLaptops: any[] = [];

  selectedLaptops: any[] = [];

  branches: Branch[] = [];

  constructor(
    private fb: FormBuilder,
    private stockService: StockService,
    private branchService: BranchService,
    private dialogRef: MatDialogRef<TransferFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  async ngOnInit(): Promise<void> {
    this.initForm();

    this.branches = await this.branchService.getBranches();
  }

  initForm() {
    this.transferForm = this.fb.group({
      fromBranch: ['', Validators.required],

      toBranch: ['', Validators.required],

      reason: ['', Validators.required],

      expectedDate: ['', Validators.required],
    });
  }

  async loadAvailableLaptops() {
    const branchId = this.transferForm.get('fromBranch')?.value;

    if (!branchId) {
      this.availableLaptops = [];
      this.filteredLaptops = [];
      return;
    }

    try {
      const stock = await this.stockService.getStockOverviewByBranch(branchId);

      this.availableLaptops = stock
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          id: item.productid,

          productId: item.productid,

          productName: item.productName,

          brand: item.brandName,

          quantity: item.quantity,

          availableQuantity: item.quantity,

          description: item.description,

          price: item.price,
        }));

      this.filteredLaptops = [...this.availableLaptops];
    } catch (error) {
      console.error('Error loading inventory', error);
    }
  }

  searchLaptop(event: any) {
    const value = event.target.value.toLowerCase();

    this.filteredLaptops = this.availableLaptops.filter(
      (item) =>
        item.productName.toLowerCase().includes(value) || item.brand?.toLowerCase().includes(value),
    );
  }

  addLaptop(product: any) {
    const exists = this.selectedLaptops.find((x) => x.productId === product.productId);

    if (!exists) {
      this.selectedLaptops.push({
        productId: product.productId,

        productName: product.productName,

        brand: product.brand,

        quantity: 1,
      });
    }
  }

  removeLaptop(product: any) {
    this.selectedLaptops = this.selectedLaptops.filter((x) => x.productId !== product.productId);
  }

  onSubmit() {
    if (this.transferForm.valid && this.selectedLaptops.length > 0) {
      const fromId = this.transferForm.value.fromBranch;

      const toId = this.transferForm.value.toBranch;

      const fromBranch = this.branches.find((b) => b.branchid === fromId);

      const toBranch = this.branches.find((b) => b.branchid === toId);

      const transferData = {
        ...this.transferForm.value,

        fromBranchName: fromBranch?.name || '',

        toBranchName: toBranch?.name || '',

        items: this.selectedLaptops,

        status: 'Pending',

        requestDate: new Date(),
      };

      this.dialogRef.close(transferData);
    } else {
      this.markFormGroupTouched(this.transferForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
