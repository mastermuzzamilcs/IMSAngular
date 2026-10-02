import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkflowStatusTransition } from '../../../core/Models/WorkflowStatusTransition';
import { WorkflowTransitionService } from '../../../core/services/workflow-transition.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { GlobalDeleteConfirmationComponent } from '../../../shared/components/global-delete-confirmation/global-delete-confirmation.component';
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
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatTooltipModule,
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
    const dialogRef = this.dialog.open(GlobalDeleteConfirmationComponent, {
      width: '300px',
      data: {
        title: 'Delete Status Transition',
        message: `Remove ${transition.fromStatus} to ${transition.toStatus} for ${this.requestTypeLabel(transition.requestType)}?`,
      },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && transition.id) {
        this.loadingService.show();
        await this.transitionService.deleteTransition(transition.id);
        this.loadingService.hide();
        this.loadTransitions();
      }
    });
  }
}
