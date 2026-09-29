import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from '../../../shared/material/material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-brand-form',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './brand-form.component.html',
  styleUrl: './brand-form.component.scss',
})
export class BrandFormComponent implements OnInit {
  brandForm!: FormGroup;
  dialogTitle: string = 'Add Brand';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<BrandFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
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
      status: ['Active', [Validators.required]],
    });
  }
  patchFormValues(): void {
    this.brandForm.patchValue(this.data._brand);
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
