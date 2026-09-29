import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { TransferFormComponent } from '../form/transfer-form.component';
import { TransferDetailComponent } from '../detail/transfer-detail.component';

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
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatMenuModule,
    DatePipe,
  ],
  templateUrl: './transfer-list.component.html',
  styleUrls: ['./transfer-list.component.scss'],
})
export class TransferListComponent implements AfterViewInit {
  displayedColumns: string[] = [
    'transferId',
    'fromBranch',
    'toBranch',
    'items',
    'requestDate',
    'status',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private dialog: MatDialog) {}

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openNewTransferDialog() {
    const dialogRef = this.dialog.open(TransferFormComponent, {
      width: '800px',
      data: { mode: 'new' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Handle new transfer
      }
    });
  }

  viewTransferDetail(transfer: any) {
    this.dialog.open(TransferDetailComponent, {
      width: '800px',
      data: { transfer },
    });
  }

  updateStatus(_transfer: any, _newStatus: string) {
    // Update transfer status
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pending':
        return 'accent';
      case 'Approved':
        return 'primary';
      case 'In Transit':
        return 'accent';
      case 'Completed':
        return 'primary';
      case 'Rejected':
        return 'warn';
      default:
        return '';
    }
  }
}
