import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { UserFormComponent } from '../form/user-form.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
  MxNoticeService,
} from '@mesix/custom-control';
import type { MxTone } from '@mesix/custom-control';
import { UsersService } from '../../../core/services/users.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { ActivatedRoute } from '@angular/router';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/Models/UsersModel';
import { Role } from '../../../core/Models/RoleModel';
import { Branch } from '../../../core/Models/BranchModel';
import { AuthService } from '../../../core/services/auth.service';
import {
  ALL_BRANCHES_ID,
  UserBranchAssociationService,
} from '../../../core/services/user-branch-association.service';
import { SYSTEM_USER_ID } from '../../../core/system-user';
import { normalizeUsername } from '../../../core/auth/username';

@Component({
  selector: 'app-userlist',
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
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);

  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['name', 'username', 'email', 'role', 'status', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  tableLoading = false;
  userRolesLookup: Role[];
  userBranchesLookup: Branch[];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _userService: UsersService,
    private authService: AuthService,
    private userBranchAssociationService: UserBranchAssociationService,
    private loadingService: LoadingService,
    private route: ActivatedRoute,
  ) {
    this.userRolesLookup = this.route.snapshot.data['roles'];
    this.userBranchesLookup = this.route.snapshot.data['branches'];
  }
  ngOnInit(): void {
    this.LoadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  openAddUserDialog() {
    const dialogRef = this.notice.open(UserFormComponent, {
      data: {
        mode: 'add',
        rolesLookup: this.userRolesLookup,
        branchesLookup: this.userBranchesLookup,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.loadingService.show();
        try {
          await this._userService.addUser(result);
        } catch (error) {
          console.error('Error adding user', error);
          this.showSaveError(error, 'Error adding user');
        } finally {
          this.loadingService.hide();
        }
        this.LoadUsers();
      }
    });
  }

  openEditUserDialog(user: User) {
    const dialogRef = this.notice.open(UserFormComponent, {
      data: {
        mode: 'edit',
        user,
        rolesLookup: this.userRolesLookup,
        branchesLookup: this.userBranchesLookup,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.loadingService.show();
        result.userid = user.userid;
        result.branch = user.branchid || user.branch || '';
        try {
          await this._userService.updateUser(result);
        } catch (error) {
          console.error('Error updating user', error);
          this.showSaveError(error, 'Error updating user');
        } finally {
          this.loadingService.hide();
        }
        this.LoadUsers();
      }
    });
  }

  toggleUserStatus(_user: User) {
    // Toggle user active status
  }

  getRoleTone(role: string): MxTone {
    switch (role) {
      case 'Admin':
        return 'danger';
      case 'Manager':
        return 'warning';
      case 'Staff':
        return 'primary';
      default:
        return 'neutral';
    }
  }

  async LoadUsers() {
    this.tableLoading = true;
    try {
      const session = this.authService.currentSession();
      if (!session) {
        this.dataSource.data = [];
        return;
      }

      const [users, branchAssociations] = await Promise.all([
        this._userService.getUsers(),
        this.userBranchAssociationService.getAssociations(),
      ]);
      const username = normalizeUsername(session.username);
      const isSuperAdmin = username === 'superadmin';
      const userBranchIds = new Set(
        branchAssociations
          .filter((association) => association.userid === session.userid)
          .map((association) => association.branchid),
      );
      const canSeeAllBranches = userBranchIds.has(ALL_BRANCHES_ID);
      const visibleUserIds = new Set(
        branchAssociations
          .filter((association) => canSeeAllBranches || userBranchIds.has(association.branchid))
          .map((association) => association.userid),
      );
      const visibleUsers = users.filter((user) => {
        const userName = normalizeUsername(user.username);
        const isReservedAccount =
          user.userid === SYSTEM_USER_ID || userName === 'system' || userName === 'superadmin';
        return (
          (isSuperAdmin || !isReservedAccount) &&
          (canSeeAllBranches || visibleUserIds.has(user.userid || ''))
        );
      });
      const usersWithRoleNames = visibleUsers.map((user) => {
        const matchedRole = this.userRolesLookup.find((r) => r.id === user.roleid);
        return {
          ...user,
          role: matchedRole ? matchedRole.name : 'Unknown',
        };
      });

      this.dataSource.data = usersWithRoleNames;
    } catch (err) {
      console.error('Error loading Users', err);
      this.toast.error('Error loading Users ');
    } finally {
      this.tableLoading = false;
    }
  }

  ResetPasswordAction(_user: User) {
    //alert('Implementation Pending');
  }

  private showSaveError(error: unknown, fallback: string): void {
    const message = error instanceof Error ? error.message : fallback;
    const normalized = message.toLowerCase();
    if (
      normalized.includes('already taken') ||
      normalized.startsWith('username must') ||
      normalized === 'username is required.' ||
      normalized.startsWith('a password is required')
    ) {
      this.toast.warning(message);
    } else {
      this.toast.error(message);
    }
  }
}
