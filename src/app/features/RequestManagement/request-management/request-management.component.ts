import { Component, DestroyRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { RequestType, WorkflowRequest } from '../../../core/Models/WorkflowModel';
import { Router } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { RequestDetailComponent } from '../request-detail/request-detail.component';
import { LoadingService } from '../../../core/services/Loading.service';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { AuthService } from '../../../core/services/auth.service';
import { BranchService } from '../../../core/services/branchservice.service';

interface WorkflowRequestRow extends WorkflowRequest {
  branchName: string;
}

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
  displayedColumns: string[] = [
    'stockId',
    'type',
    'branchName',
    'requestedBy',
    'assignedTo',
    'requestedOn',
    'status',
  ];
  dataSource = new MatTableDataSource<WorkflowRequestRow>([]);
  private watchedBranch: string | null = null;
  private branchNames = new Map<string, string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private workflowService: WorkflowService,
    private branchService: BranchService,
    private _loadingService: LoadingService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private auth: AuthService,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.auth.session$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((session) => {
      const next = session?.branchid || '';
      if (next === this.watchedBranch) {
        return;
      }
      this.watchedBranch = next;
      void this.loadRequests();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async loadRequests() {
    const branchId = this.auth.currentBranchId();
    if (!branchId) {
      this.dataSource.data = [];
      this._loadingService.hide();
      return;
    }
    this._loadingService.show();
    try {
      const [requests, branches] = await Promise.all([
        this.workflowService.getForBranch(branchId),
        this.branchService.getBranches(),
      ]);
      this.branchNames = new Map(
        branches.map((branch) => [branch.branchid || '', branch.name || '']),
      );
      this.dataSource.data = requests.map((request) => ({
        ...request,
        branchName: this.branchLabel(request),
      }));
    } catch (error) {
      console.error('Error loading workflow requests', error);
      this.snack.open('Could not load workflow requests', 'Dismiss', { duration: 3000 });
    } finally {
      this._loadingService.hide();
    }
  }

  private branchLabel(request: WorkflowRequest): string {
    const from =
      this.branchNames.get(request.branchId || '') || request.branchId || '';
    const to =
      this.branchNames.get(request.toBranchId || '') || request.toBranchId || '';
    if (request.requestType === RequestType.Transfer) {
      if (from && to && from !== to) {
        return `${from} → ${to}`;
      }
      return from || to || '—';
    }
    return from || '—';
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
