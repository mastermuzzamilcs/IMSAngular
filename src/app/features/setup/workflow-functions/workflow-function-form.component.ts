import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { WorkflowFunctionRecord } from '../../../core/Models/WorkflowFunctionRecord';

@Component({
  selector: 'app-workflow-function-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './workflow-function-form.component.html',
})
export class WorkflowFunctionFormComponent implements OnInit {
  form!: FormGroup;
  dialogTitle = 'Add Workflow Function';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<WorkflowFunctionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string; record?: WorkflowFunctionRecord },
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      className: ['', Validators.required],
    });
    if (this.data.mode === 'edit' && this.data.record) {
      this.dialogTitle = 'Edit Workflow Function';
      this.form.patchValue(this.data.record);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(this.form.value);
  }
}
