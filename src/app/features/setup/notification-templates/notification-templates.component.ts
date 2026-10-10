import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import {
  notificationAudienceLabel,
  notificationChannelLabel,
  NotificationTemplate,
} from '../../../core/notifications/notification.model';
import { LoadingService } from '../../../core/services/Loading.service';
import { NotificationTemplateService } from '../../../core/services/notification-template.service';
import { GlobalDeleteConfirmationComponent } from '../../../shared/components/global-delete-confirmation/global-delete-confirmation.component';
import { NotificationTemplateFormComponent } from './notification-template-form.component';

@Component({
  selector: 'app-notification-templates',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    PrivilegeDirective,
  ],
  templateUrl: './notification-templates.component.html',
  styleUrl: './notification-templates.component.scss',
})
export class NotificationTemplatesComponent implements OnInit, AfterViewInit {
  readonly privileges = privilegeAccess;
  readonly channelLabel = notificationChannelLabel;
  readonly audienceLabel = notificationAudienceLabel;
  displayedColumns = ['name', 'type', 'audience', 'events', 'enabled', 'actions'];
  dataSource = new MatTableDataSource<NotificationTemplate>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private templateService: NotificationTemplateService,
    private loadingService: LoadingService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    void this.loadTemplates();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  channelText(template: NotificationTemplate): string {
    return this.channelLabel[template.channel];
  }

  audienceText(template: NotificationTemplate): string {
    return this.audienceLabel[template.audience];
  }

  eventLabel(template: NotificationTemplate): string {
    if (!template.events.length) {
      return 'None';
    }
    return template.events.map((event) => `${event.requestType} / ${event.status}`).join(', ');
  }

  async loadTemplates(): Promise<void> {
    this.loadingService.show();
    try {
      this.dataSource.data = await this.templateService.getTemplates();
    } catch (error) {
      console.error('Error loading notification templates', error);
      alert('Error loading notification templates');
    }
    this.loadingService.hide();
  }

  openAddDialog(): void {
    this.dialog
      .open(NotificationTemplateFormComponent, { width: '760px', data: { mode: 'add' } })
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
          alert(error instanceof Error ? error.message : 'Could not save the template');
          this.loadingService.hide();
        }
      });
  }

  openEditDialog(template: NotificationTemplate): void {
    this.dialog
      .open(NotificationTemplateFormComponent, {
        width: '760px',
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
          alert(error instanceof Error ? error.message : 'Could not save the template');
          this.loadingService.hide();
        }
      });
  }

  openDeleteDialog(template: NotificationTemplate): void {
    this.dialog
      .open(GlobalDeleteConfirmationComponent, {
        width: '360px',
        data: {
          title: 'Delete Notification Template',
          message: `Are you sure you want to delete "${template.name}"?`,
        },
      })
      .afterClosed()
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
          alert('Could not delete the template');
          this.loadingService.hide();
        }
      });
  }
}
