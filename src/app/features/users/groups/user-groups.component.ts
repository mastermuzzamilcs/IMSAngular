import { ConfirmService } from '../../../core/services/confirm.service';
import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
  MxNoticeService,
} from '@mesix/custom-control';
import { UserGroup } from '../../../core/Models/UserGroupModel';
import { LoadingService } from '../../../core/services/Loading.service';
import { UserGroupAssociationService } from '../../../core/services/user-group-association.service';
import { UserGroupService } from '../../../core/services/user-group.service';
import { UserGroupFormComponent } from './user-group-form.component';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-user-groups',
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
    MxBadgeComponent,
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './user-groups.component.html',
})
export class UserGroupsComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);
  private readonly confirm = inject(ConfirmService);

  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['name', 'description', 'canApprove', 'status', 'actions'];
  dataSource = new MatTableDataSource<UserGroup>([]);
  tableLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private groupService: UserGroupService,
    private associationService: UserGroupAssociationService,
    private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onGridFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  async loadGroups(): Promise<void> {
    this.tableLoading = true;
    try {
      this.dataSource.data = await this.groupService.getGroups(true);
    } catch (error) {
      console.error('Error loading user groups', error);
      this.toast.error('Error loading user groups');
    }
    this.tableLoading = false;
  }

  openAddDialog(): void {
    const dialogRef = this.notice.open(UserGroupFormComponent, {
      data: { mode: 'add' },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }
      this.loadingService.show();
      await this.groupService.addGroup(result);
      this.loadingService.hide();
      this.loadGroups();
    });
  }

  openEditDialog(group: UserGroup): void {
    const dialogRef = this.notice.open(UserGroupFormComponent, {
      data: { mode: 'edit', group },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result || !group.id) {
        return;
      }
      this.loadingService.show();
      await this.groupService.updateGroup({ ...result, id: group.id });
      this.loadingService.hide();
      this.loadGroups();
    });
  }

  openDeleteDialog(group: UserGroup): void {
    this.confirm
      .confirmDelete(`Delete "${group.name}"?`, 'Delete User Group')
      .subscribe(async (confirmed) => {
        if (!confirmed || !group.id) {
          return;
        }
        this.loadingService.show();
        const associations = await this.associationService.getAssociations();
        await Promise.all(
          associations
            .filter((item) => item.groupid === group.id && item.id)
            .map((item) => this.associationService.disassociate(item.id as string)),
        );
        await this.groupService.deleteGroup(group.id);
        this.loadingService.hide();
        this.loadGroups();
      });
  }
}
