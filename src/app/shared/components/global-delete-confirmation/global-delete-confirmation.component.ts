import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-global-delete-confirmation',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './global-delete-confirmation.component.html',
  styleUrl: './global-delete-confirmation.component.scss',
})
export class GlobalDeleteConfirmationComponent {
  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
