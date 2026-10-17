import { ConfirmService } from '../../../core/services/confirm.service';
import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
  MxNoticeService,
} from '@mesix/custom-control';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import {
  notificationAudienceSummary,
  notificationChannelLabel,
  NotificationTemplate,
} from '../../../core/notifications/notification.model';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { BranchService } from '../../../core/services/branchservice.service';
import { NotificationTemplateService } from '../../../core/services/notification-template.service';
import { ALL_BRANCHES_ID } from '../../../core/services/user-branch-association.service';
import { NotificationTemplateFormComponent } from './notification-template-form.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-notification-templates',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './notification-templates.component.html',
  styleUrl: './notification-templates.component.scss',
})
export class NotificationTemplatesComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);
  private readonly confirm = inject(ConfirmService);

  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  readonly channelLabel = notificationChannelLabel;
  displayedColumns = ['branch', 'name', 'type', 'audience', 'events', 'enabled', 'actions'];
  private branchNames = new Map<string, string>();
  dataSource = new MatTableDataSource<NotificationTemplate>([]);
  tableLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private templateService: NotificationTemplateService,
    private branchService: BranchService,
    private auth: AuthService,
    private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    void this.loadTemplates();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onGridFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  channelText(template: NotificationTemplate): string {
    return this.channelLabel[template.channel];
  }

  audienceText(template: NotificationTemplate): string {
    return notificationAudienceSummary(template);
  }

  eventLabel(template: NotificationTemplate): string {
    if (!template.events.length) {
      return 'None';
    }
    return template.events.map((event) => `${event.requestType} / ${event.status}`).join(', ');
  }

  branchLabel(template: NotificationTemplate): string {
    if (!template.branchid || template.branchid === ALL_BRANCHES_ID) {
      return 'All branches';
    }
    return this.branchNames.get(template.branchid) || template.branchid;
  }

  async loadTemplates(): Promise<void> {
    this.tableLoading = true;
    try {
      const [templates, branches] = await Promise.all([
        this.templateService.getTemplates(),
        this.branchService.getBranches(),
      ]);
      this.branchNames = new Map(branches.map((branch) => [branch.branchid, branch.name]));
      const allowed = new Set(
        (this.auth.currentSession()?.branches || []).map((branch) => branch.branchid),
      );
      allowed.add(ALL_BRANCHES_ID);
      this.dataSource.data = templates.filter((template) =>
        allowed.has(template.branchid || ALL_BRANCHES_ID),
      );
    } catch (error) {
      console.error('Error loading notification templates', error);
      this.toast.error('Error loading notification templates');
    } finally {
      this.tableLoading = false;
    }
  }

  openAddDialog(): void {
    this.notice
      .open(NotificationTemplateFormComponent, { data: { mode: 'add' } })
      .afterClosed()
      .subscribe(async (result: NotificationTemplate | undefined) => {
        if (!result) {
          return;
        }
        this.loadingService.show();
        try {
          await this.templateService.addTemplate(result);
          await this.loadTemplates();
        } catch (error) {
          console.error('Error adding notification template', error);
          this.toastFailure(error, 'Could not save the template');
        } finally {
          this.loadingService.hide();
        }
      });
  }

  openEditDialog(template: NotificationTemplate): void {
    this.notice
      .open(NotificationTemplateFormComponent, {
        data: { mode: 'edit', template },
      })
      .afterClosed()
      .subscribe(async (result: NotificationTemplate | undefined) => {
        if (!result || !template.id) {
          return;
        }
        this.loadingService.show();
        try {
          await this.templateService.updateTemplate({ ...result, id: template.id });
          await this.loadTemplates();
        } catch (error) {
          console.error('Error updating notification template', error);
          this.toastFailure(error, 'Could not save the template');
        } finally {
          this.loadingService.hide();
        }
      });
  }

  openDeleteDialog(template: NotificationTemplate): void {
    this.confirm
      .confirmDelete(
        `Are you sure you want to delete "${template.name}"?`,
        'Delete Notification Template',
      )
      .subscribe(async (confirmed: boolean) => {
        if (!confirmed || !template.id) {
          return;
        }
        this.loadingService.show();
        try {
          await this.templateService.deleteTemplate(template.id);
          await this.loadTemplates();
        } catch (error) {
          console.error('Error deleting notification template', error);
          this.toast.error('Could not delete the template');
        } finally {
          this.loadingService.hide();
        }
      });
  }

  private toastFailure(error: unknown, fallback: string): void {
    const message = error instanceof Error ? error.message : fallback;
    if (message.toLowerCase().includes('already exists')) {
      this.toast.warning(message);
    } else {
      this.toast.error(message);
    }
  }
}
