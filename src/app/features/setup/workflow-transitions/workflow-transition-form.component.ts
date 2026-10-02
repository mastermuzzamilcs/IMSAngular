import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { RequestStatus, RequestType } from '../../../core/Models/WorkflowModel';
import { WorkflowStatusTransition } from '../../../core/Models/WorkflowStatusTransition';

@Component({
  selector: 'app-workflow-transition-form',
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
  templateUrl: './workflow-transition-form.component.html',
})
export class WorkflowTransitionFormComponent implements OnInit {
  form!: FormGroup;
  dialogTitle = 'Add Status Transition';
  requestTypes = Object.values(RequestType);
  statuses = Object.values(RequestStatus);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<WorkflowTransitionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string; transition?: WorkflowStatusTransition },
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      requestType: [''],
      fromStatus: ['', Validators.required],
      toStatus: ['', Validators.required],
      label: ['', Validators.required],
    });
    if (this.data.mode === 'edit' && this.data.transition) {
      this.dialogTitle = 'Edit Status Transition';
      this.form.patchValue(this.data.transition);
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
      requestType: this.form.value.requestType || '',
    });
  }
}
