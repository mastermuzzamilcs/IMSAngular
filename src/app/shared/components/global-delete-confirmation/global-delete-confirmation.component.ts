import { MX_DIALOG_DATA, MxDialogRef } from '@mesix/custom-control';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-global-delete-confirmation',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './global-delete-confirmation.component.html',
  styleUrl: './global-delete-confirmation.component.scss',
})
export class GlobalDeleteConfirmationComponent {
  constructor(
    public dialogRef: MxDialogRef<any>,
    @Inject(MX_DIALOG_DATA) public data: any,
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
