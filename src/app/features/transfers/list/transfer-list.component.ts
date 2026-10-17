import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
  MxNoticeService,
} from '@mesix/custom-control';
import type { MxTone } from '@mesix/custom-control';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { TransferFormComponent } from '../form/transfer-form.component';
import { TransferDetailComponent } from '../detail/transfer-detail.component';

import { TransferService } from '../../../core/services/transfer.service';
import { Status } from '../../../core/enums/status.enum';
import { Transfer } from '../../../core/Models/TransferModel';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-transfer-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
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
  private readonly notice = inject(MxNoticeService);
  private readonly toast = inject(ToastService);

  readonly Status = Status;
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
  tableLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private transferService: TransferService) {}

  async ngOnInit(): Promise<void> {
    await this.loadTransfers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async loadTransfers() {
    this.tableLoading = true;
    try {
      const transfers = await this.transferService.getTransfers();
      this.dataSource.data = transfers;
    } catch (error) {
      console.error('Error loading transfers', error);
      this.toast.error('Could not load transfers');
    } finally {
      this.tableLoading = false;
    }
  }

  applyFilter(event: Event) {
    this.onGridFilter((event.target as HTMLInputElement).value);
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  openNewTransferDialog() {
    console.log('New Transfer clicked');

    const dialogRef = this.notice.open(TransferFormComponent, {
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
          this.toast.error(error instanceof Error ? error.message : 'Could not save the transfer');
        }
      }
    });
  }

  viewTransferDetail(transfer: Transfer) {
    this.notice.open(TransferDetailComponent, {
      data: {
        transfer,
      },
    });
  }

  async updateStatus(transfer: Transfer, newStatus: Status) {
    try {
      await this.transferService.updateTransfer({
        ...transfer,

        status: newStatus as Transfer['status'],
      });

      await this.loadTransfers();
      this.toast.success(`Transfer status updated to ${newStatus}`);
    } catch (error) {
      console.error('Status update failed', error);
      this.toast.error(error instanceof Error ? error.message : 'Could not update transfer status');
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case Status.Pending:
        return 'accent';

      case Status.Approved:
        return 'primary';

      case Status.InTransit:
        return 'accent';

      case Status.Completed:
        return 'primary';

      case Status.Rejected:
        return 'warn';

      default:
        return '';
    }
  }

  getStatusTone(status: string): MxTone {
    switch (status) {
      case Status.Pending:
        return 'warning';
      case Status.Approved:
        return 'primary';
      case Status.InTransit:
        return 'info';
      case Status.Completed:
        return 'success';
      case Status.Rejected:
        return 'danger';
      default:
        return 'neutral';
    }
  }
}
