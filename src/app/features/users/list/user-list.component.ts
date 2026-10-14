import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserFormComponent } from '../form/user-form.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
} from '@mesix/custom-control';
import type { MxTone } from '@mesix/custom-control';
import { UsersService } from '../../../core/services/users.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { ActivatedRoute } from '@angular/router';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';

@Component({
  selector: 'app-userlist',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatDialogModule,
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
  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  userRolesLookup: any[];
  userBranchesLookup: any[];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private _userService: UsersService,
    private loadingService: LoadingService,
    private dialog: MatDialog,
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
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '600px',
      data: {
        mode: 'add',
        rolesLookup: this.userRolesLookup,
        branchesLookup: this.userBranchesLookup,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.loadingService.show();
        await this._userService.addUser(result);
        this.loadingService.hide();
        this.LoadUsers();
      }
    });
  }

  openEditUserDialog(user: any) {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '600px',
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
        await this._userService.updateUser(result);
        this.loadingService.hide();
        this.LoadUsers();
      }
    });
  }

  toggleUserStatus(_user: any) {
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
    this.loadingService.show();
    try {
      const Users = await this._userService.getUsers();
      const usersWithRoleNames = Users.map((user) => {
        const matchedRole = this.userRolesLookup.find((r) => r.id === user.roleid);
        return {
          ...user,
          role: matchedRole ? matchedRole.name : 'Unknown',
        };
      });

      this.dataSource.data = usersWithRoleNames;
    } catch (err) {
      console.error('Error loading Users', err);
      alert('Error loading Users ');
    }
    this.loadingService.hide();
  }

  ResetPasswordAction(_user: any) {
    //alert('Implementation Pending');
  }
}
