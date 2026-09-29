import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserFormComponent } from '../form/user-form.component';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { UsersService } from '../../../core/services/users.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { ActivatedRoute } from '@angular/router';
import { Role } from '../../../core/Models/RoleModel';

@Component({
  selector: 'app-userlist',
  standalone: true,
  imports: [CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatDialogModule, MatCardModule, MatFormFieldModule, MatChipsModule, MatSlideToggleModule
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'email', 'role', 'branch', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  userRolesLookup : any[];
  userBranchesLookup : any[];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private _userService: UsersService, private loadingService: LoadingService, private dialog: MatDialog,private route: ActivatedRoute) { 
this.userRolesLookup=this.route.snapshot.data['roles'];
this.userBranchesLookup=this.route.snapshot.data['branches'];
  }
  ngOnInit(): void {
    this.LoadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openAddUserDialog() {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '600px',
      data: { mode: 'add',rolesLookup:this.userRolesLookup,branchesLookup:this.userBranchesLookup }
    });

    dialogRef.afterClosed().subscribe(async result => {
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
      data: { mode: 'edit', user ,rolesLookup:this.userRolesLookup,branchesLookup:this.userBranchesLookup }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        this.loadingService.show();
        result.userid = user.userid;
        await this._userService.updateUser(result);
        this.loadingService.hide();
        this.LoadUsers();
      }
    });
  }

  toggleUserStatus(user: any) {
    // Toggle user active status
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'Admin': return 'warn';
      case 'Manager': return 'accent';
      case 'Staff': return 'primary';
      default: return '';
    }
  }
  async LoadUsers() {
    this.loadingService.show();
    try {
      const Users = await this._userService.getUsers();
      const usersWithRoleNames = Users.map(user => {
        const matchedRole = this.userRolesLookup.find(r => r.id === user.roleid);
        const matchedBranch = this.userBranchesLookup.find(b => b.branchid === user.branchid);
        return {
          ...user,
          role: matchedRole ? matchedRole.name : 'Unknown',
          branch: matchedBranch ? matchedBranch.name : 'Unknown'
        };
      });

      this.dataSource.data = usersWithRoleNames;
    } catch (err) {
      console.error('Error loading Users', err);
      alert('Error loading Users ');
    }
    this.loadingService.hide();
  }
  ResetPasswordAction(user: any){
    //alert('Implementation Pending');
  }
}
