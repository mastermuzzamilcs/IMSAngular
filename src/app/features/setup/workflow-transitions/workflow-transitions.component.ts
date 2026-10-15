import { ConfirmService } from '../../../core/services/confirm.service';
import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
  MxNoticeService,
} from '@mesix/custom-control';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkflowStatusTransition } from '../../../core/Models/WorkflowStatusTransition';
import { WorkflowTransitionService } from '../../../core/services/workflow-transition.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { WorkflowTransitionFormComponent } from './workflow-transition-form.component';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-workflow-transitions',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatTooltipModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxBadgeComponent,
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './workflow-transitions.component.html',
})
export class WorkflowTransitionsComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);
  private readonly confirm = inject(ConfirmService);

  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['requestType', 'fromStatus', 'toStatus', 'label', 'actions'];
  dataSource = new MatTableDataSource<WorkflowStatusTransition>([]);
  tableLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private transitionService: WorkflowTransitionService,
    private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.loadTransitions();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onGridFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  requestTypeLabel(requestType: string): string {
    return requestType || 'Generic';
  }

  async loadTransitions(): Promise<void> {
    this.tableLoading = true;
    try {
      this.dataSource.data = await this.transitionService.getTransitions();
    } catch (err) {
      console.error('Error loading status transitions', err);
      this.toast.error('Error loading status transitions');
    }
    this.tableLoading = false;
  }

  openAddDialog(): void {
    const dialogRef = this.notice.open(WorkflowTransitionFormComponent, {
      data: { mode: 'add' },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }
      this.loadingService.show();
      try {
        await this.transitionService.addTransition(result);
        await this.loadTransitions();
      } catch (err) {
        this.toast.error(err instanceof Error ? err.message : 'Failed to add status transition');
      }
      this.loadingService.hide();
    });
  }

  openEditDialog(transition: WorkflowStatusTransition): void {
    const dialogRef = this.notice.open(WorkflowTransitionFormComponent, {
      data: { mode: 'edit', transition },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }
      this.loadingService.show();
      try {
        await this.transitionService.updateTransition({ ...result, id: transition.id });
        await this.loadTransitions();
      } catch (err) {
        this.toast.error(err instanceof Error ? err.message : 'Failed to update status transition');
      }
      this.loadingService.hide();
    });
  }

  openDeleteDialog(transition: WorkflowStatusTransition): void {
    this.confirm
      .confirmDelete(
        `Remove ${transition.fromStatus} → ${transition.toStatus}?`,
        'Delete Status Transition',
      )
      .subscribe(async (result) => {
        if (result && transition.id) {
          this.loadingService.show();
          await this.transitionService.deleteTransition(transition.id);
          this.loadingService.hide();
          this.loadTransitions();
        }
      });
  }
}
