import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxGridComponent,
  MxEmptyStateComponent,
  MxPageHeaderComponent,
} from '@mesix/custom-control';
import type { MxTone } from '@mesix/custom-control';

import { TransferFormComponent } from '../form/transfer-form.component';
import { TransferDetailComponent } from '../detail/transfer-detail.component';

import { TransferService } from '../../../core/services/transfer.service';
import { Transfer } from '../../../core/Models/TransferModel';

@Component({
  selector: 'app-transfer-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    DatePipe,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxBadgeComponent,
    MxEmptyStateComponent,
  ],
  templateUrl: './transfer-list.component.html',
  styleUrls: ['./transfer-list.component.scss'],
})
export class TransferListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'transferId',
    'fromBranch',
    'toBranch',
    'items',
    'requestDate',
    'status',
    'actions',
  ];

  dataSource = new MatTableDataSource<Transfer>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private dialog: MatDialog,
    private transferService: TransferService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadTransfers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async loadTransfers() {
    try {
      const transfers = await this.transferService.getTransfers();

      this.dataSource.data = transfers;
    } catch (error) {
      console.error('Error loading transfers', error);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;

    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openNewTransferDialog() {
    console.log('New Transfer clicked');

    const dialogRef = this.dialog.open(TransferFormComponent, {
      width: '800px',
      data: {
        mode: 'new',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      console.log('Dialog closed', result);

      if (result) {
        try {
          await this.transferService.addTransfer(result as Transfer);

          console.log('Transfer saved successfully');

          await this.loadTransfers();
        } catch (error) {
          console.error('Error saving transfer', error);
        }
      }
    });
  }

  viewTransferDetail(transfer: any) {
    this.dialog.open(TransferDetailComponent, {
      width: '800px',
      data: {
        transfer,
      },
    });
  }

  async updateStatus(transfer: any, newStatus: string) {
    try {
      await this.transferService.updateTransfer({
        ...transfer,

        status: newStatus,
      });

      await this.loadTransfers();

      console.log('Status Updated', newStatus);
    } catch (error) {
      console.error('Status update failed', error);
    }
  }

  getStatusTone(status: string): MxTone {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Approved':
        return 'primary';
      case 'In Transit':
        return 'info';
      case 'Completed':
        return 'success';
      case 'Rejected':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }
}
