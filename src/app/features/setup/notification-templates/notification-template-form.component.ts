import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { isStatus, Status } from '../../../core/enums/status.enum';
import { ItemSource } from '../../../core/item-sources/item-source.model';
import { ItemSourceService } from '../../../core/services/item-source.service';
import { User } from '../../../core/Models/UsersModel';
import { UserGroup } from '../../../core/Models/UserGroupModel';
import { RequestStatus, RequestType } from '../../../core/Models/WorkflowModel';
import { NotificationDispatcherRegistry } from '../../../core/notifications/notification-dispatcher.registry';
import {
  notificationChannelLabel,
  NotificationAudience,
  NotificationChannel,
  NotificationEventBinding,
  NotificationTemplate,
} from '../../../core/notifications/notification.model';
import { UserGroupService } from '../../../core/services/user-group.service';
import { UsersService } from '../../../core/services/users.service';
import { ALL_BRANCHES_ID } from '../../../core/services/user-branch-association.service';
import { AuthService } from '../../../core/services/auth.service';
import { SessionBranch } from '../../../core/Models/AuthSession';
import { CustomerSearchModalComponent } from '../../../shared/components/customer-search-modal/customer-search-modal.component';

@Component({
  selector: 'app-notification-template-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  templateUrl: './notification-template-form.component.html',
  styleUrl: './notification-template-form.component.scss',
})
export class NotificationTemplateFormComponent implements OnInit {
  readonly channelLabel = notificationChannelLabel;
  readonly requestTypes = Object.values(RequestType);
  readonly requestStatuses = Object.values(RequestStatus);
  form!: FormGroup;
  dialogTitle = 'Add Notification Template';
  readonly allBranchesId = ALL_BRANCHES_ID;
  channels: NotificationChannel[] = [];
  branches: SessionBranch[] = [];
  groups: UserGroup[] = [];
  users: User[] = [];
  selectedUsers: { id: string; name: string }[] = [];
  itemSources: ItemSource[] = [];
  insertCode = '';

  constructor(
    private fb: FormBuilder,
    private registry: NotificationDispatcherRegistry,
    private groupService: UserGroupService,
    private usersService: UsersService,
    private itemSourceService: ItemSourceService,
    private auth: AuthService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<NotificationTemplateFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { mode: string; template?: NotificationTemplate },
  ) {}

  ngOnInit(): void {
    this.channels = this.registry.channels();
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      branchid: [this.auth.currentBranchId() || ALL_BRANCHES_ID, Validators.required],
      channel: [this.channels[0] || NotificationChannel.InApp, Validators.required],
      includePublic: [false],
      includeGroups: [false],
      includeUsers: [false],
      groupIds: [[] as string[]],
      userIds: [[] as string[]],
      audienceSources: [[] as string[]],
      subject: ['', Validators.required],
      summary: [''],
      body: [''],
      enabled: [true],
      events: this.fb.array([]),
    });
    void this.loadChoices();
    if (this.data.mode === 'edit' && this.data.template) {
      this.dialogTitle = 'Edit Notification Template';
      const template = this.data.template;
      this.form.patchValue({
        ...template,
        includePublic: template.includePublic,
        includeGroups: template.groupIds.length > 0,
        includeUsers: template.userIds.length > 0,
        audienceSources: template.audienceSources || [],
      });
      template.events.forEach((event) => this.addEvent(event));
    }
  }

  get selectedUserLabel(): string {
    return this.selectedUsers.map((user) => user.name).join(', ');
  }

  get events(): FormArray {
    return this.form.get('events') as FormArray;
  }

  addEvent(event?: NotificationEventBinding): void {
    this.events.push(
      this.fb.group({
        requestType: [event?.requestType || RequestType.Sales, Validators.required],
        status: [event?.status || RequestStatus.Pending, Validators.required],
      }),
    );
  }

  removeEvent(index: number): void {
    this.events.removeAt(index);
  }

  insertItemSource(target: 'subject' | 'summary' | 'body'): void {
    if (!this.insertCode) {
      return;
    }
    const control = this.form.get(target);
    const current = String(control?.value || '').trim();
    const token = `{{${this.insertCode}}}`;
    control?.setValue(current ? `${current} ${token}` : token);
    control?.markAsDirty();
  }

  openUserDialog(): void {
    this.dialog
      .open(CustomerSearchModalComponent, {
        width: '95vw',
        maxWidth: '960px',
        maxHeight: '85vh',
        data: {
          type: 'all',
          isMultiSelect: true,
          selectedIds: this.form.value.userIds || [],
        },
      })
      .afterClosed()
      .subscribe((result: User[] | null) => {
        if (!result) {
          return;
        }
        this.selectedUsers = result
          .filter((user) => user.userid)
          .map((user) => ({ id: user.userid as string, name: user.name }));
        this.form.patchValue({ userIds: this.selectedUsers.map((user) => user.id) });
        this.form.get('userIds')?.setErrors(null);
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const includePublic = value.includePublic === true;
    const includeGroups = value.includeGroups === true;
    const includeUsers = value.includeUsers === true;
    const groupIds = includeGroups ? (value.groupIds as string[]) : [];
    const userIds = includeUsers ? (value.userIds as string[]) : [];
    const audienceSources = (value.audienceSources as string[]) || [];
    if (includeGroups && groupIds.length === 0) {
      this.form.get('groupIds')?.setErrors({ required: true });
      this.form.get('groupIds')?.markAsTouched();
      return;
    }
    if (includeUsers && userIds.length === 0) {
      this.form.get('userIds')?.setErrors({ required: true });
      this.form.get('userIds')?.markAsTouched();
      return;
    }
    if (
      !includePublic &&
      groupIds.length === 0 &&
      userIds.length === 0 &&
      audienceSources.length === 0
    ) {
      alert('Choose at least one audience: public, groups, custom users, or an item source.');
      return;
    }
    const seen = new Set<string>();
    const events = (value.events as NotificationEventBinding[]).filter((event) => {
      const key = `${event.requestType}|${event.status}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    this.dialogRef.close({
      ...value,
      code: value.code.trim(),
      name: value.name.trim(),
      summary: (value.summary || '').trim(),
      body: (value.body || '').trim(),
      includePublic,
      groupIds,
      userIds,
      audienceSources,
      audience: includePublic
        ? NotificationAudience.Public
        : groupIds.length
          ? NotificationAudience.Group
          : NotificationAudience.CustomUsers,
      events,
    });
  }

  private async loadChoices(): Promise<void> {
    const [groups, users] = await Promise.all([
      this.groupService.getGroups(),
      this.usersService.getUsers(),
    ]);
    this.branches = this.auth.currentSession()?.branches || [];
    this.groups = groups.filter((group) => !isStatus(group.status, Status.Inactive));
    this.users = users.filter((user) => user.userid && !isStatus(user.status, Status.Inactive));
    const selectedIds = (this.form.value.userIds || []) as string[];
    this.selectedUsers = selectedIds.map((id) => ({
      id,
      name: this.users.find((user) => user.userid === id)?.name || id,
    }));
    try {
      this.itemSources = await this.itemSourceService.getSources();
      if (!this.insertCode && this.itemSources[0]) {
        this.insertCode = this.itemSources[0].code;
      }
    } catch (error) {
      console.error('Error loading item sources', error);
      this.itemSources = [];
    }
  }
}
