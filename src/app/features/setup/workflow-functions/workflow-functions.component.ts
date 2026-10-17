import { ConfirmService } from '../../../core/services/confirm.service';
import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
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
import { WorkflowFunctionRecord } from '../../../core/Models/WorkflowFunctionRecord';
import { WorkflowFunctionLink } from '../../../core/Models/WorkflowFunctionLink';
import { WorkflowFunctionDefinitionService } from '../../../core/services/workflow-function-definition.service';
import { WorkflowFunctionLinkService } from '../../../core/services/workflow-function-link.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { WorkflowFunctionFormComponent } from './workflow-function-form.component';
import { WorkflowFunctionLinkFormComponent } from './workflow-function-link-form.component';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-workflow-functions',
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
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './workflow-functions.component.html',
})
export class WorkflowFunctionsComponent implements OnInit, AfterViewInit {
  tableLoading = false;
  private readonly notice = inject(MxNoticeService);
  private readonly confirm = inject(ConfirmService);

  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
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

  onFunctionsFilter(value: string): void {
    this.functions.filter = value.trim().toLowerCase();
  }

  onLinksFilter(value: string): void {
    this.links.filter = value.trim().toLowerCase();
  }

  functionName(code: string): string {
    return this.functions.data.find((item) => item.code === code)?.name || code;
  }

  async load(): Promise<void> {
    this.tableLoading = true;
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
      this.toast.error('Error loading workflow functions');
    }
    this.tableLoading = false;
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
    this.confirm
      .confirmDelete(`Delete ${record.name}?`, 'Delete Workflow Function')
      .subscribe(async (result) => {
        if (result && record.id) {
          this.loadingService.show();
          try {
            await this.definitionService.deleteFunction(record.id);
            await this.load();
          } catch (error) {
            this.toastFailure(error, 'Could not delete the workflow function');
          } finally {
            this.loadingService.hide();
          }
        }
      });
  }

  openDeleteLink(link: WorkflowFunctionLink): void {
    this.confirm
      .confirmDelete(`Remove ${this.functionName(link.functionKey)}?`, 'Delete Association')
      .subscribe(async (result) => {
        if (result && link.id) {
          this.loadingService.show();
          try {
            await this.linkService.deleteLink(link.id);
            await this.load();
          } catch (error) {
            this.toastFailure(error, 'Could not delete the association');
          } finally {
            this.loadingService.hide();
          }
        }
      });
  }

  private openFunctionDialog(mode: string, record?: WorkflowFunctionRecord): void {
    const dialogRef = this.notice.open(WorkflowFunctionFormComponent, {
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
        this.toastFailure(err, 'Failed to save workflow function');
      } finally {
        this.loadingService.hide();
      }
    });
  }

  private openLinkDialog(mode: string, link?: WorkflowFunctionLink): void {
    const dialogRef = this.notice.open(WorkflowFunctionLinkFormComponent, {
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
        this.toastFailure(err, 'Failed to save association');
      } finally {
        this.loadingService.hide();
      }
    });
  }

  private toastFailure(error: unknown, fallback: string): void {
    const message = error instanceof Error ? error.message : fallback;
    if (message.toLowerCase().includes('already')) {
      this.toast.warning(message);
    } else {
      this.toast.error(message);
    }
  }
}
