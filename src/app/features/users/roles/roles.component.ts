import { ConfirmService } from '../../../core/services/confirm.service';
import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { Role } from '../../../core/Models/RoleModel';
import { RoleService } from '../../../core/services/role.service';
import { RolesFormComponent } from '../roles-form/roles-form.component';
import { CommonModule } from '@angular/common';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
  MxNoticeService,
} from '@mesix/custom-control';
import { MatIconModule } from '@angular/material/icon';
import { LoadingService } from '../../../core/services/Loading.service';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-roles',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatSortModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxBadgeComponent,
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
  standalone: true,
})
export class RolesComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);
  private readonly confirm = inject(ConfirmService);

  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['name', 'description', 'status', 'actions'];
  dataSource = new MatTableDataSource<Role>();
  tableLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private roleService: RoleService,
    private _loadingService: LoadingService,
  ) {}

  ngOnInit() {
    this.loadRoles();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    this.onGridFilter((event.target as HTMLInputElement).value);
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  async loadRoles() {
    this.tableLoading = true;
    try {
      const roles = await this.roleService.getRoles();
      this.dataSource.data = roles;
    } catch (err) {
      console.error('Error loading User Roles', err);
      this.toast.error('Error loading User Roles');
    } finally {
      this.tableLoading = false;
    }
  }

  openAddDialog() {
    const dialogRef = this.notice.open(RolesFormComponent, {
      data: { mode: 'add' },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this._loadingService.show();
        try {
          await this.roleService.addRole(result);
          await this.loadRoles();
        } catch (error) {
          console.error('Error adding role', error);
          this.toast.error(error instanceof Error ? error.message : 'Could not add the role');
        } finally {
          this._loadingService.hide();
        }
      }
    });
  }

  openEditDialog(role: Role) {
    const dialogRef = this.notice.open(RolesFormComponent, {
      data: { mode: 'edit', role },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this._loadingService.show();
        result.id = role.id;
        try {
          await this.roleService.updateRole(result);
          await this.loadRoles();
        } catch (error) {
          console.error('Error updating role', error);
          this.toast.error(error instanceof Error ? error.message : 'Could not update the role');
        } finally {
          this._loadingService.hide();
        }
      }
    });
  }
  openDeleteDialog(role: Role) {
    this.confirm
      .confirmDelete(`Are you sure you want to delete "${role.name}"?`, 'Delete Role')
      .subscribe(async (result) => {
        if (result) {
          if (role.id) {
            this._loadingService.show();
            try {
              await this.roleService.deleteRole(role.id);
              await this.loadRoles();
            } catch (error) {
              console.error('Error deleting role', error);
              this.toast.error(
                error instanceof Error ? error.message : 'Could not delete the role',
              );
            } finally {
              this._loadingService.hide();
            }
          }
        }
      });
  }
}
