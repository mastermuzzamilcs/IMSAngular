import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  MxButtonComponent,
  MxGridComponent,
  MxEmptyStateComponent,
  MxPageHeaderComponent,
} from '@mesix/custom-control';
import { WorkflowStatusTransition } from '../../../core/Models/WorkflowStatusTransition';
import { WorkflowTransitionService } from '../../../core/services/workflow-transition.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { WorkflowTransitionFormComponent } from './workflow-transition-form.component';

@Component({
  selector: 'app-workflow-transitions',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatDialogModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxEmptyStateComponent,
  ],
  templateUrl: './workflow-transitions.component.html',
})
export class WorkflowTransitionsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['requestType', 'fromStatus', 'toStatus', 'label', 'actions'];
  dataSource = new MatTableDataSource<WorkflowStatusTransition>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private transitionService: WorkflowTransitionService,
    private loadingService: LoadingService,
    private dialog: MatDialog,
    private confirm: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.loadTransitions();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  requestTypeLabel(requestType: string): string {
    return requestType || 'Generic';
  }

  async loadTransitions(): Promise<void> {
    this.loadingService.show();
    try {
      this.dataSource.data = await this.transitionService.getTransitions();
    } catch (err) {
      console.error('Error loading status transitions', err);
      alert('Error loading status transitions');
    }
    this.loadingService.hide();
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(WorkflowTransitionFormComponent, {
      width: '500px',
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
        alert(err instanceof Error ? err.message : 'Failed to add status transition');
      }
      this.loadingService.hide();
    });
  }

  openEditDialog(transition: WorkflowStatusTransition): void {
    const dialogRef = this.dialog.open(WorkflowTransitionFormComponent, {
      width: '500px',
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
        alert(err instanceof Error ? err.message : 'Failed to update status transition');
      }
      this.loadingService.hide();
    });
  }

  openDeleteDialog(transition: WorkflowStatusTransition): void {
    this.confirm
      .confirmDelete(
        `Remove ${transition.fromStatus} to ${transition.toStatus} for ${this.requestTypeLabel(transition.requestType)}?`,
        'Delete Status Transition',
      )
      .subscribe(async (confirmed) => {
        if (confirmed && transition.id) {
          this.loadingService.show();
          await this.transitionService.deleteTransition(transition.id);
          this.loadingService.hide();
          this.loadTransitions();
        }
      });
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }
}
