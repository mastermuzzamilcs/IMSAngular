import { MX_DIALOG_DATA, MxDialogRef } from '@mesix/custom-control';
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Transfer } from '../../../core/Models/TransferModel';

interface TransferDetailData {
  transfer: Transfer;
}
@Component({
  selector: 'app-transfer-detail',
  templateUrl: './transfer-detail.component.html',
  styleUrls: ['./transfer-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule],
})
export class TransferDetailComponent {
  constructor(
    public dialogRef: MxDialogRef<unknown>,
    @Inject(MX_DIALOG_DATA) public data: TransferDetailData,
  ) {}
  get transfer() {
    return this.data.transfer;
  }
}
