import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from '../../../shared/material/material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Role } from '../../../core/Models/RoleModel';
import { Branch } from '../../../core/Models/BranchModel';
import { User } from '../../../core/Models/UsersModel';
import { UsersService } from '../../../core/services/users.service';
import jsonData from '../../../Assets/appConfig.json';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
})
export class UserFormComponent implements OnInit {
  userForm!: FormGroup;
  dialogTitle: string = 'Add User';
  _roles: Role[] | null = null;
  _branches: Branch[] | null = null;
  _managerUsers: User[] = [];
  managerRoleName: string = jsonData.managerRoleName;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UsersService,
  ) {}

  ngOnInit(): void {
    this.InitForm();
    this._roles = this.data.rolesLookup;
    this._branches = this.data.branchesLookup;

    const managerRole = this._roles?.find(
      (r) => r.name.toLowerCase() === this.managerRoleName.toLowerCase(),
    );
    if (managerRole?.id) {
      this.userService.getUsersByRole(managerRole.id).then((tempUsers) => {
        this._managerUsers = tempUsers;
      });
    }

    if (this.data.mode === 'edit') {
      this.dialogTitle = 'Edit User';
      this.patchFormValues();
    }
  }
  InitForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['', [Validators.required]],
      manager: [''],
      branch: [''],
      status: ['Active'],
    });
  }
  patchFormValues(): void {
    const user = this.data.user;
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.roleid || user.role,
      branch: user.branchid || user.branch,
      manager: user.manager,
      status: user.status,
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
