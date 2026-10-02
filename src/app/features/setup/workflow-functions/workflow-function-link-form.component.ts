import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { RequestStatus, RequestType } from '../../../core/Models/WorkflowModel';
import { WorkflowFunctionLink } from '../../../core/Models/WorkflowFunctionLink';
import { WorkflowFunctionRecord } from '../../../core/Models/WorkflowFunctionRecord';

@Component({
  selector: 'app-workflow-function-link-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './workflow-function-link-form.component.html',
})
export class WorkflowFunctionLinkFormComponent implements OnInit {
  form!: FormGroup;
  dialogTitle = 'Associate Workflow Function';
  requestTypes = Object.values(RequestType);
  statuses = Object.values(RequestStatus);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<WorkflowFunctionLinkFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { mode: string; link?: WorkflowFunctionLink; functions: WorkflowFunctionRecord[] },
  ) {}

  get functions(): WorkflowFunctionRecord[] {
    return this.data.functions || [];
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      requestType: ['', Validators.required],
      status: ['', Validators.required],
      functionKey: ['', Validators.required],
      priority: [1, [Validators.required, Validators.min(1)]],
    });
    if (this.data.mode === 'edit' && this.data.link) {
      this.dialogTitle = 'Edit Association';
      this.form.patchValue(this.data.link);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close({
      ...this.form.value,
      priority: Number(this.form.value.priority) || 1,
    });
  }
}
