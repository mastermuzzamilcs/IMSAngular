import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserGroup } from '../../../core/Models/UserGroupModel';
import { LoadingService } from '../../../core/services/Loading.service';
import { UserGroupAssociationService } from '../../../core/services/user-group-association.service';
import { UserGroupService } from '../../../core/services/user-group.service';
import { GlobalDeleteConfirmationComponent } from '../../../shared/components/global-delete-confirmation/global-delete-confirmation.component';
import { UserGroupFormComponent } from './user-group-form.component';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';

@Component({
  selector: 'app-user-groups',
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
    MatChipsModule,
    MatTooltipModule,
    PrivilegeDirective,
  ],
  templateUrl: './user-groups.component.html',
})
export class UserGroupsComponent implements OnInit, AfterViewInit {
  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['name', 'description', 'canApprove', 'status', 'actions'];
  dataSource = new MatTableDataSource<UserGroup>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private groupService: UserGroupService,
    private associationService: UserGroupAssociationService,
    private loadingService: LoadingService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async loadGroups(): Promise<void> {
    this.loadingService.show();
    try {
      this.dataSource.data = await this.groupService.getGroups(true);
    } catch (error) {
      console.error('Error loading user groups', error);
      alert('Error loading user groups');
    }
    this.loadingService.hide();
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(UserGroupFormComponent, {
      width: '480px',
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
    const dialogRef = this.dialog.open(UserGroupFormComponent, {
      width: '480px',
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
    const dialogRef = this.dialog.open(GlobalDeleteConfirmationComponent, {
      width: '360px',
      data: {
        title: 'Delete User Group',
        message: `Delete "${group.name}"? Users associated with this group will lose it.`,
      },
    });
    dialogRef.afterClosed().subscribe(async (confirmed) => {
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
