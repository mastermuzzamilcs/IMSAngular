import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowService } from '../../../core/services/Workflow.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Status } from '../../../core/enums/status.enum';
import { WorkflowRequest } from '../../../core/Models/WorkflowModel';
import { Router } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { RequestDetailComponent } from '../request-detail/request-detail.component';
import { LoadingService } from '../../../core/services/Loading.service';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-request-management',
  standalone: true,
  templateUrl: './request-management.component.html',
  styleUrls: ['./request-management.component.scss'],
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatCardModule,
    MatDividerModule,
  ],
})
export class RequestManagementComponent implements OnInit, AfterViewInit {
  readonly Status = Status;
  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['stockId', 'type', 'requestedBy', 'requestedOn', 'status'];
  dataSource = new MatTableDataSource<WorkflowRequest>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private workflowService: WorkflowService,
    private _loadingService: LoadingService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private auth: AuthService,
  ) {}

  async ngOnInit() {
    await this.loadRequests();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async loadRequests() {
    this._loadingService.show();
    const Requests = await this.workflowService.getWKFRequests();
    this.dataSource.data = Requests;
    this._loadingService.hide();
  }
  onRowDblClick(req: WorkflowRequest) {
    if (
      !this.auth.hasPrivilege(
        this.privileges.workflowRequests.details.moduleId,
        this.privileges.workflowRequests.details.functionId,
      )
    ) {
      return;
    }
    this.dialog
      .open(RequestDetailComponent, {
        width: '750px',
        data: { requestId: req.requestId },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.updated) this.loadRequests(); // refresh grid
      });
  }
}
