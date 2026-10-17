import { ConfirmService } from '../../../core/services/confirm.service';
import { Component, OnInit, AfterViewInit, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { BranchFormComponent } from '../form/branch-form.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  MxBadgeComponent,
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
  MxNoticeService,
} from '@mesix/custom-control';
import { BranchService } from '../../../core/services/branchservice.service';
import { Status } from '../../../core/enums/status.enum';
import { Branch } from '../../../core/Models/BranchModel';
import { User } from '../../../core/Models/UsersModel';
import { Role } from '../../../core/Models/RoleModel';
import { LoadingService } from '../../../core/services/Loading.service';
import { ActivatedRoute } from '@angular/router';
import jsonData from '../../../Assets/appConfig.json';
import { UsersService } from '../../../core/services/users.service';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
    CommonModule,
    MatIconModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxGridComponent,
    MxBadgeComponent,
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss'],
})
export class BranchListComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);
  private readonly confirm = inject(ConfirmService);

  private readonly toast = inject(ToastService);

  readonly Status = Status;
  readonly privileges = privilegeAccess;
  displayedColumns: string[] = ['name', 'location', 'manager', 'contact', 'status', 'actions'];
  dataSource = new MatTableDataSource<Branch>([]);
  tableLoading = false;
  userRolesLookup: Role[];
  managerUsersLookup: User[] | null = null;
  managerRoleName: string = jsonData.managerRoleName;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private branchService: BranchService,
    private _userService: UsersService,
    private loadingService: LoadingService,
    private route: ActivatedRoute,
  ) {
    this.userRolesLookup = this.route.snapshot.data['roles'];
  }

  async ngOnInit(): Promise<void> {
    const managerRole = this.userRolesLookup?.find(
      (r) => r.name.toLowerCase() === this.managerRoleName.toLowerCase(),
    );
    if (managerRole?.id) {
      this.loadingService.show();
      try {
        this.managerUsersLookup = await this._userService.getUsersByRole(managerRole.id);
      } catch (error) {
        console.error('Error loading branch managers', error);
        this.toast.error('Could not load branch managers');
      } finally {
        this.loadingService.hide();
      }
    }
    this.loadBranches();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.onGridFilter(filterValue);
  }

  onGridFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  openAddDialog() {
    const dialogRef = this.notice.open(BranchFormComponent, {
      data: { mode: 'add', managerUsersLookup: this.managerUsersLookup },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.loadingService.show();
        try {
          await this.branchService.addBranch(result);
          await this.loadBranches();
        } catch (error) {
          console.error('Error adding branch', error);
          this.toast.error(error instanceof Error ? error.message : 'Could not add the branch');
        } finally {
          this.loadingService.hide();
        }
      }
    });
  }
  openEditDialog(branch: Branch) {
    const dialogRef = this.notice.open(BranchFormComponent, {
      data: { mode: 'edit', branch, managerUsersLookup: this.managerUsersLookup },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.loadingService.show();
        result.branchid = branch.branchid;
        try {
          await this.branchService.updateBranch(result);
          await this.loadBranches();
        } catch (error) {
          console.error('Error updating branch', error);
          this.toast.error(error instanceof Error ? error.message : 'Could not update the branch');
        } finally {
          this.loadingService.hide();
        }
      }
    });
  }

  async loadBranches(): Promise<void> {
    this.tableLoading = true;
    try {
      const branches = await this.branchService.getBranches();
      const branchesWithManagerNames = branches.map((branch) => {
        const matchedManager = this.managerUsersLookup?.find((m) => m.userid === branch.managerid);
        return {
          ...branch,
          manager: matchedManager ? matchedManager.name : 'Unknown',
        };
      });
      this.dataSource.data = branchesWithManagerNames;
    } catch (err) {
      console.error('Error loading branches', err);
      this.toast.error('Error loading branches');
    } finally {
      this.tableLoading = false;
    }
  }
  openDeleteDialog(branch: Branch) {
    this.confirm
      .confirmDelete(`Are you sure you want to delete "${branch.name}"?`, 'Delete Branch')
      .subscribe(async (result) => {
        if (result) {
          if (branch.branchid) {
            this.loadingService.show();
            try {
              await this.branchService.deleteBranch(branch.branchid);
              await this.loadBranches();
            } catch (error) {
              console.error('Error deleting branch', error);
              this.toast.error(error instanceof Error ? error.message : 'Could not delete the branch');
            } finally {
              this.loadingService.hide();
            }
          }
        }
      });
  }
}
