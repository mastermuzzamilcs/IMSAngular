import { MX_DIALOG_DATA, MxDialogRef } from '@mesix/custom-control';
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { asStatus, Status } from '../../../core/enums/status.enum';
import { UserGroup } from '../../../core/Models/UserGroupModel';

@Component({
  selector: 'app-user-group-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  templateUrl: './user-group-form.component.html',
})
export class UserGroupFormComponent implements OnInit {
  readonly Status = Status;
  groupForm!: FormGroup;
  dialogTitle = 'Add User Group';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MxDialogRef<unknown>,
    @Inject(MX_DIALOG_DATA) public data: { mode: string; group?: UserGroup },
  ) {}

  ngOnInit(): void {
    this.groupForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      status: [Status.Active, Validators.required],
      canApprove: [false],
    });
    if (this.data.mode === 'edit' && this.data.group) {
      this.dialogTitle = 'Edit User Group';
      this.groupForm.patchValue({
        ...this.data.group,
        status: asStatus(this.data.group.status),
        canApprove: !!this.data.group.canApprove,
      });
    }
  }

  onSubmit(): void {
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.groupForm.value);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
