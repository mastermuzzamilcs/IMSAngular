import { Component, DestroyRef, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { WorkflowService } from '../../../core/services/Workflow.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { Status } from '../../../core/enums/status.enum';
import { RequestType, WorkflowRequest } from '../../../core/Models/WorkflowModel';
import {
  MxBadgeComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
  MxNoticeService,
} from '@mesix/custom-control';
import { RequestDetailComponent } from '../request-detail/request-detail.component';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { AuthService } from '../../../core/services/auth.service';
import { BranchService } from '../../../core/services/branchservice.service';
import { ToastService } from '../../../core/services/toast.service';
import { UsersService } from '../../../core/services/users.service';
import { SYSTEM_USER_ID, SYSTEM_USER_NAME } from '../../../core/system-user';

interface WorkflowRequestRow extends WorkflowRequest {
  branchName: string;
  requestedByName: string;
  assignedToName: string;
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
    MxPageHeaderComponent,
    MxGridComponent,
    MxBadgeComponent,
    MxEmptyStateComponent,
  ],
})
export class RequestManagementComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);
  private readonly toast = inject(ToastService);

  readonly Status = Status;
  readonly privileges = privilegeAccess;
  displayedColumns: string[] = [
    'requestedOn',
    'type',
    'branchName',
    'requestedBy',
    'assignedTo',
    'status',
  ];
  dataSource = new MatTableDataSource<WorkflowRequestRow>([]);
  tableLoading = false;
  private watchedBranch: string | null = null;
  private branchNames = new Map<string, string>();
  private userNames = new Map<string, string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private workflowService: WorkflowService,
    private branchService: BranchService,
    private usersService: UsersService,
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
      this.tableLoading = false;
      return;
    }
    this.tableLoading = true;
    try {
      const [requests, branches, users] = await Promise.all([
        this.workflowService.getForBranch(branchId),
        this.branchService.getBranches(),
        this.usersService.getUsers(),
      ]);
      this.branchNames = new Map(
        branches.map((branch) => [branch.branchid || '', branch.name || '']),
      );
      this.userNames = new Map(
        users
          .filter((user) => !!user.userid)
          .map((user) => [user.userid as string, user.name || user.userid || '']),
      );
      this.userNames.set(SYSTEM_USER_ID, SYSTEM_USER_NAME);
      this.dataSource.data = requests.map((request) => ({
        ...request,
        branchName: this.branchLabel(request),
        requestedByName: this.userLabel(request.requestedBy),
        assignedToName: this.userLabel(request.assignedTo),
      }));
    } catch (error) {
      console.error('Error loading workflow requests', error);
      this.toast.error('Could not load workflow requests', 3000);
    } finally {
      this.tableLoading = false;
    }
  }

  private branchLabel(request: WorkflowRequest): string {
    const from = this.branchNames.get(request.branchId || '') || request.branchId || '';
    const to = this.branchNames.get(request.toBranchId || '') || request.toBranchId || '';
    if (request.requestType === RequestType.Transfer) {
      if (from && to && from !== to) {
        return `${from} → ${to}`;
      }
      return from || to || '—';
    }
    return from || '—';
  }

  private userLabel(userId: string | undefined): string {
    const id = (userId || '').trim();
    if (!id) {
      return '—';
    }
    return this.userNames.get(id) || id;
  }

  onGridFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
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
    this.notice
      .open(RequestDetailComponent, {
        data: { requestId: req.requestId },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.updated) this.loadRequests();
      });
  }
}
