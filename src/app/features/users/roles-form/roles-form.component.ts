import { Component, Inject, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from '../../../shared/material/material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MxButtonComponent, MxDialogRef, MX_DIALOG_DATA } from '@mesix/custom-control';
import { asStatus, Status } from '../../../core/enums/status.enum';
import { Role } from '../../../core/Models/RoleModel';

@Component({
  selector: 'app-roles-form',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MaterialModule,
    ReactiveFormsModule,
    CommonModule,
    MxButtonComponent,
  ],
  templateUrl: './roles-form.component.html',
  styleUrl: './roles-form.component.scss',
})
export class RolesFormComponent implements OnInit {
  readonly Status = Status;
  userRoleForm!: FormGroup;
  dialogTitle: string = 'Add Role';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MxDialogRef<unknown>,
    @Inject(MX_DIALOG_DATA) public data: { mode: string; role?: Role },
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
      status: [Status.Active, [Validators.required]],
    });
  }
  patchFormValues(): void {
    this.userRoleForm.patchValue({
      ...this.data.role,
      status: asStatus(this.data.role?.status),
    });
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
