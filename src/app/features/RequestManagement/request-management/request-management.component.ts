import { Component, DestroyRef, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { WorkflowService } from '../../../core/services/Workflow.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
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
import { WorkflowRequestPageCursor } from '../../../core/services/Workflow.service';

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
  private pageCursors: Array<WorkflowRequestPageCursor | undefined> = [undefined];
  pageSize = 25;
  pageIndex = 0;
  totalRequests = 0;
  private sortField: 'requestedOn' | 'requestType' = 'requestedOn';
  private sortDirection: 'asc' | 'desc' = 'desc';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

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
      this.resetPagination();
      void this.loadRequests(0);
    });
  }

  ngAfterViewInit() {
    this.paginator.pageSize = this.pageSize;
  }

  async loadRequests(pageIndex = this.pageIndex) {
    const branchId = this.auth.currentBranchId();
    if (!branchId) {
      this.dataSource.data = [];
      this.tableLoading = false;
      return;
    }
    const cursor = this.pageCursors[pageIndex];
    if (pageIndex > 0 && !cursor) {
      this.resetPagination();
      pageIndex = 0;
    }
    this.tableLoading = true;
    try {
      const [page, branches, users] = await Promise.all([
        this.workflowService.getForBranchPage(
          branchId,
          this.pageSize,
          this.pageCursors[pageIndex],
          this.sortField,
          this.sortDirection,
        ),
        this.branchService.getBranches(),
        this.usersService.getUsers(),
      ]);
      if (page.totalCount >= 0) this.totalRequests = page.totalCount;
      this.pageIndex = pageIndex;
      if (page.nextCursor) this.pageCursors[pageIndex + 1] = page.nextCursor;
      else this.pageCursors.length = pageIndex + 1;
      if (this.paginator) {
        this.paginator.pageIndex = pageIndex;
        this.paginator.pageSize = this.pageSize;
        this.paginator.length = this.totalRequests;
      }
      this.branchNames = new Map(
        branches.map((branch) => [branch.branchid || '', branch.name || '']),
      );
      this.userNames = new Map(
        users
          .filter((user) => !!user.userid)
          .map((user) => [user.userid as string, user.name || user.userid || '']),
      );
      this.userNames.set(SYSTEM_USER_ID, SYSTEM_USER_NAME);
      this.dataSource.data = page.requests.map((request) => ({
        ...request,
        branchName: this.branchLabel(request),
        requestedByName: this.userLabel(request.requestedBy),
        assignedToName: this.userLabel(request.assignedTo),
      }));
    } catch (error) {
      console.error('Error loading workflow requests', error);
      const details = error instanceof Error ? error.message : '';
      this.toast.error(
        /index/i.test(details)
          ? 'Request pagination indexes are missing. Deploy firestore.indexes.json and try again.'
          : 'Could not load workflow requests',
        5000,
      );
    } finally {
      this.tableLoading = false;
    }
  }

  onPageChange(event: PageEvent): void {
    if (event.pageSize !== this.pageSize) {
      this.pageSize = event.pageSize;
      this.resetPagination();
    }
    void this.loadRequests(event.pageIndex);
  }

  onSortChange(sort: Sort): void {
    if (sort.active !== 'requestedOn' && sort.active !== 'type') return;
    this.sortField = sort.active === 'type' ? 'requestType' : 'requestedOn';
    this.sortDirection = sort.direction === 'asc' ? 'asc' : 'desc';
    this.resetPagination();
    if (this.paginator) this.paginator.pageIndex = 0;
    void this.loadRequests(0);
  }

  private resetPagination(): void {
    this.pageCursors = [undefined];
    this.pageIndex = 0;
    this.totalRequests = 0;
  }

  refreshRequests(): void {
    this.resetPagination();
    if (this.paginator) this.paginator.pageIndex = 0;
    void this.loadRequests(0);
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
        if (res?.updated) this.refreshRequests();
      });
  }
}
