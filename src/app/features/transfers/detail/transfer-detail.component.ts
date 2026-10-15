import { MX_DIALOG_DATA, MxDialogRef } from '@mesix/custom-control';
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'app-transfer-detail',
  templateUrl: './transfer-detail.component.html',
  styleUrls: ['./transfer-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule],
})
export class TransferDetailComponent {
  constructor(
    public dialogRef: MxDialogRef<any>,
    @Inject(MX_DIALOG_DATA) public data: any,
  ) {}
  get transfer() {
    return this.data.transfer;
  }
}
