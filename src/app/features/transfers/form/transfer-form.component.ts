import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

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
  selectedLaptops: any[] = [];

  branches = [
    { id: 1, name: 'Branch A' },
    { id: 2, name: 'Branch B' },
    { id: 3, name: 'Branch C' },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TransferFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}
  ngOnInit(): void {
    this.initForm();
    this.loadAvailableLaptops();
  }

  initForm(): void {
    this.transferForm = this.fb.group({
      fromBranch: ['', [Validators.required]],
      toBranch: ['', [Validators.required]],
      reason: ['', [Validators.required]],
      expectedDate: ['', [Validators.required]],
    });
  }

  loadAvailableLaptops(): void {
    // Load laptops from the selected branch
  }

  addLaptop(laptop: any): void {
    if (!this.selectedLaptops.find((l) => l.id === laptop.id)) {
      this.selectedLaptops.push(laptop);
    }
  }

  removeLaptop(laptop: any): void {
    this.selectedLaptops = this.selectedLaptops.filter((l) => l.id !== laptop.id);
  }

  onSubmit(): void {
    if (this.transferForm.valid && this.selectedLaptops.length > 0) {
      const transferData = {
        ...this.transferForm.value,
        items: this.selectedLaptops,
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

  onCancel(): void {
    this.dialogRef.close();
  }
}
