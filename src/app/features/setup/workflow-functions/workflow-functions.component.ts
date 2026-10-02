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
import { WorkflowFunctionRecord } from '../../../core/Models/WorkflowFunctionRecord';
import { WorkflowFunctionLink } from '../../../core/Models/WorkflowFunctionLink';
import { WorkflowFunctionDefinitionService } from '../../../core/services/workflow-function-definition.service';
import { WorkflowFunctionLinkService } from '../../../core/services/workflow-function-link.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { GlobalDeleteConfirmationComponent } from '../../../shared/components/global-delete-confirmation/global-delete-confirmation.component';
import { WorkflowFunctionFormComponent } from './workflow-function-form.component';
import { WorkflowFunctionLinkFormComponent } from './workflow-function-link-form.component';

@Component({
  selector: 'app-workflow-functions',
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
  templateUrl: './workflow-functions.component.html',
})
export class WorkflowFunctionsComponent implements OnInit, AfterViewInit {
  functionColumns: string[] = ['code', 'name', 'className', 'functionActions'];
  linkColumns: string[] = ['requestType', 'status', 'priority', 'functionName', 'linkActions'];
  functions = new MatTableDataSource<WorkflowFunctionRecord>([]);
  links = new MatTableDataSource<WorkflowFunctionLink>([]);

  @ViewChild('functionPaginator') functionPaginator!: MatPaginator;
  @ViewChild('linkPaginator') linkPaginator!: MatPaginator;
  @ViewChild('functionSort') functionSort!: MatSort;
  @ViewChild('linkSort') linkSort!: MatSort;

  constructor(
    private definitionService: WorkflowFunctionDefinitionService,
    private linkService: WorkflowFunctionLinkService,
    private loadingService: LoadingService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    this.functions.paginator = this.functionPaginator;
    this.functions.sort = this.functionSort;
    this.links.paginator = this.linkPaginator;
    this.links.sort = this.linkSort;
  }

  functionName(code: string): string {
    return this.functions.data.find((item) => item.code === code)?.name || code;
  }

  async load(): Promise<void> {
    this.loadingService.show();
    try {
      this.functions.data = await this.definitionService.getFunctions();
      this.links.data = (await this.linkService.getLinks()).sort((left, right) => {
        const byType = String(left.requestType).localeCompare(String(right.requestType));
        if (byType !== 0) {
          return byType;
        }
        const byStatus = String(left.status).localeCompare(String(right.status));
        if (byStatus !== 0) {
          return byStatus;
        }
        return left.priority - right.priority;
      });
    } catch (err) {
      console.error('Error loading workflow functions', err);
      alert('Error loading workflow functions');
    }
    this.loadingService.hide();
  }

  openAddFunction(): void {
    this.openFunctionDialog('add');
  }

  openEditFunction(record: WorkflowFunctionRecord): void {
    this.openFunctionDialog('edit', record);
  }

  openAddLink(): void {
    this.openLinkDialog('add');
  }

  openEditLink(link: WorkflowFunctionLink): void {
    this.openLinkDialog('edit', link);
  }

  openDeleteFunction(record: WorkflowFunctionRecord): void {
    const dialogRef = this.dialog.open(GlobalDeleteConfirmationComponent, {
      width: '300px',
      data: {
        title: 'Delete Workflow Function',
        message: `Delete ${record.name}?`,
      },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && record.id) {
        this.loadingService.show();
        await this.definitionService.deleteFunction(record.id);
        this.loadingService.hide();
        this.load();
      }
    });
  }

  openDeleteLink(link: WorkflowFunctionLink): void {
    const dialogRef = this.dialog.open(GlobalDeleteConfirmationComponent, {
      width: '300px',
      data: {
        title: 'Delete Association',
        message: `Remove ${this.functionName(link.functionKey)} from ${link.requestType} / ${link.status}?`,
      },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && link.id) {
        this.loadingService.show();
        await this.linkService.deleteLink(link.id);
        this.loadingService.hide();
        this.load();
      }
    });
  }

  private openFunctionDialog(mode: string, record?: WorkflowFunctionRecord): void {
    const dialogRef = this.dialog.open(WorkflowFunctionFormComponent, {
      width: '500px',
      data: { mode, record },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }
      this.loadingService.show();
      try {
        if (mode === 'edit') {
          await this.definitionService.updateFunction({ ...result, id: record?.id });
        } else {
          await this.definitionService.addFunction(result);
        }
        await this.load();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to save workflow function');
      }
      this.loadingService.hide();
    });
  }

  private openLinkDialog(mode: string, link?: WorkflowFunctionLink): void {
    const dialogRef = this.dialog.open(WorkflowFunctionLinkFormComponent, {
      width: '500px',
      data: { mode, link, functions: this.functions.data },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }
      this.loadingService.show();
      try {
        if (mode === 'edit') {
          await this.linkService.updateLink({ ...result, id: link?.id });
        } else {
          await this.linkService.addLink(result);
        }
        await this.load();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to save association');
      }
      this.loadingService.hide();
    });
  }
}
