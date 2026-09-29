import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from '../../../shared/material/material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-roles-form',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './roles-form.component.html',
  styleUrl: './roles-form.component.scss',
})
export class RolesFormComponent implements OnInit {
  userRoleForm!: FormGroup;
  dialogTitle: string = 'Add Role';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RolesFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}
  ngOnInit(): void {
    this.InitForm();

    if (this.data.mode === 'edit') {
      this.dialogTitle = 'Edit Role';
      this.patchFormValues();
    }
  }
  InitForm(): void {
    this.userRoleForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      status: ['Active', [Validators.required]],
    });
  }
  patchFormValues(): void {
    this.userRoleForm.patchValue(this.data.role);
  }
  onSubmit() {
    if (this.userRoleForm.valid) {
      this.dialogRef.close(this.userRoleForm.value);
    } else {
      this.markFormGroupTouched(this.userRoleForm);
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
