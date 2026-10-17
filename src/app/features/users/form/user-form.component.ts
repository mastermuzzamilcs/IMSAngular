import { Component, Inject, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from '../../../shared/material/material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MxButtonComponent, MxDialogRef, MX_DIALOG_DATA } from '@mesix/custom-control';
import { Role } from '../../../core/Models/RoleModel';
import { User } from '../../../core/Models/UsersModel';
import { Branch } from '../../../core/Models/BranchModel';
import { asStatus, Status } from '../../../core/enums/status.enum';
import { USERNAME_PATTERN } from '../../../core/auth/username';
import { UsersService } from '../../../core/services/users.service';
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MaterialModule,
    ReactiveFormsModule,
    CommonModule,
    MxButtonComponent,
  ],
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
    private usersService: UsersService,
    public dialogRef: MxDialogRef<unknown>,
    @Inject(MX_DIALOG_DATA)
    public data: {
      mode: string;
      rolesLookup: Role[];
      branchesLookup: Branch[];
      user?: User;
    },
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
      username: ['', [Validators.required, Validators.pattern(USERNAME_PATTERN)]],
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
    const user = this.data.user!;
    this.userForm.patchValue({
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.roleid || user.role,
      status: asStatus(user.status),
    });
  }
  async onSubmit(): Promise<void> {
    if (!this.userForm.valid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }
    const usernameControl = this.userForm.get('username')!;
    const taken = await this.usersService.isUsernameTaken(
      usernameControl.value,
      this.data.user?.userid,
    );
    if (taken) {
      usernameControl.setErrors({ taken: true });
      usernameControl.markAsTouched();
      return;
    }
    this.dialogRef.close(this.userForm.value);
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
