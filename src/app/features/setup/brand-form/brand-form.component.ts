import { Component, Inject, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from '../../../shared/material/material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MxButtonComponent, MxDialogRef, MX_DIALOG_DATA } from '@mesix/custom-control';
import { asStatus, Status } from '../../../core/enums/status.enum';
import { Brand } from '../../../core/Models/BrandModel';

@Component({
  selector: 'app-brand-form',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MaterialModule,
    ReactiveFormsModule,
    CommonModule,
    MxButtonComponent,
  ],
  templateUrl: './brand-form.component.html',
  styleUrl: './brand-form.component.scss',
})
export class BrandFormComponent implements OnInit {
  readonly Status = Status;
  brandForm!: FormGroup;
  dialogTitle: string = 'Add Brand';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MxDialogRef<unknown>,
    @Inject(MX_DIALOG_DATA) public data: { mode: string; _brand?: Brand },
  ) {}
  ngOnInit(): void {
    this.InitForm();

    if (this.data.mode === 'edit') {
      this.dialogTitle = 'Edit Brand';
      this.patchFormValues();
    }
  }
  InitForm(): void {
    this.brandForm = this.fb.group({
      name: ['', [Validators.required]],
      alias: [''],
      description: [''],
      country: [''],
      status: [Status.Active, [Validators.required]],
    });
  }
  patchFormValues(): void {
    this.brandForm.patchValue({
      ...this.data._brand,
      status: asStatus(this.data._brand?.status),
    });
  }
  onSubmit() {
    if (this.brandForm.valid) {
      this.dialogRef.close(this.brandForm.value);
    } else {
      this.markFormGroupTouched(this.brandForm);
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
