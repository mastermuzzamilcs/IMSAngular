import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from '../../../shared/material/material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Role } from '../../../core/Models/RoleModel';
import { asStatus, Status } from '../../../core/enums/status.enum';
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent implements OnInit {
  readonly Status = Status;
  userForm!: FormGroup;
  dialogTitle: string = 'Add User';
  _roles: Role[] | null = null;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.InitForm();
    this._roles = this.data.rolesLookup;

    if (this.data.mode === 'edit') {
      this.dialogTitle = 'Edit User';
      this.patchFormValues();
    }
  }
  InitForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        this.data?.mode === 'edit'
          ? [Validators.minLength(6)]
          : [Validators.required, Validators.minLength(6)],
      ],
      role: ['', [Validators.required]],
      status: [Status.Active],
    });
  }
  patchFormValues(): void {
    const user = this.data.user;
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.roleid || user.role,
      status: asStatus(user.status),
    });
  }
  onSubmit(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    } else {
      this.markFormGroupTouched(this.userForm);
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
    this.dialogRef.close(null);
  }
}
