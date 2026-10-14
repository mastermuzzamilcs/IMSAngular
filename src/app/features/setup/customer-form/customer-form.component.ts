import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from '../../../shared/material/material.module';
import { MxButtonComponent, MxDialogRef, MX_DIALOG_DATA } from '@mesix/custom-control';
import { asStatus, Status } from '../../../core/enums/status.enum';
import { Customer } from '../../../core/Models/CustomerModel';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MaterialModule,
    MxButtonComponent
  ],
  templateUrl: './customer-form.component.html',
})
export class CustomerFormComponent implements OnInit {
  readonly Status = Status;
  customerForm!: FormGroup;
  dialogTitle = 'Add Customer';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MxDialogRef<any>,
    @Inject(MX_DIALOG_DATA) public data: { mode: string; customer?: Customer },
  ) {}

  ngOnInit(): void {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      email: ['', Validators.email],
      address: [''],
      status: [Status.Active],
    });
    if (this.data.mode === 'edit' && this.data.customer) {
      this.dialogTitle = 'Edit Customer';
      this.customerForm.patchValue({
        ...this.data.customer,
        status: asStatus(this.data.customer.status),
      });
    }
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.customerForm.value);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
