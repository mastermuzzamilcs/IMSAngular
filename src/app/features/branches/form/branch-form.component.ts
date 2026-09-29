import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from '../../../shared/material/material.module';
import { CommonModule } from '@angular/common';
import jsonData from '../../../Assets/appConfig.json';
import { User } from '../../../core/Models/UsersModel';
import { Role } from '../../../core/Models/RoleModel';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './branch-form.component.html',
  styleUrls: ['./branch-form.component.scss'],
})
export class BranchFormComponent implements OnInit {
  branchForm!: FormGroup;
  dialogTitle: string = 'Add Branch';
  _roles: Role[] | null = null;
  _managerUsers: User[] = [];
  managerRoleName: string = jsonData.managerRoleName;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BranchFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this._managerUsers = this.data.managerUsersLookup;

    if (this.data.mode === 'edit') {
      this.dialogTitle = 'Edit Branch';
      this.patchFormValues();
    }
  }

  initForm(): void {
    this.branchForm = this.fb.group({
      name: ['', [Validators.required]],
      location: ['', [Validators.required]],
      manager: ['', [Validators.required]],
      contact: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s-()]{10,15}$/)]],
      email: ['', [Validators.email]],
      status: ['Active'],
      address: ['', [Validators.required]],
    });
  }

  patchFormValues(): void {
    const branch = this.data.branch;
    this.branchForm.patchValue({
      name: branch.name,
      location: branch.location,
      manager: branch.managerid || branch.manager,
      contact: branch.contact,
      email: branch.email,
      status: branch.status,
      address: branch.address,
    });
  }

  onSubmit(): void {
    if (this.branchForm.valid) {
      this.dialogRef.close(this.branchForm.value);
    } else {
      this.markFormGroupTouched(this.branchForm);
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
