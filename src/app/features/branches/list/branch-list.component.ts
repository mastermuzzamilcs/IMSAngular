import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BranchFormComponent } from '../form/branch-form.component';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { BranchService } from '../../../core/services/branchservice.service';
import { Branch } from '../../../core/Models/BranchModel';
import { LoadingService } from '../../../core/services/Loading.service';
import { GlobalDeleteConfirmationComponent } from '../../../shared/components/global-delete-confirmation/global-delete-confirmation.component';
import { ActivatedRoute } from '@angular/router';
import jsonData from '../../../Assets/appConfig.json';
import { UsersService } from '../../../core/services/users.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [
    MatDialogModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
    CommonModule,
    MatFormFieldModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss'],
})
export class BranchListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'location', 'manager', 'contact', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>([]);
  userRolesLookup: any[];
  managerUsersLookup: any[] | null = null;
  managerRoleName: string = jsonData.managerRoleName;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private branchService: BranchService,
    private _userService: UsersService,
    private loadingService: LoadingService,
    private dialog: MatDialog,
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
      await this._userService.getUsersByRole(managerRole.id).then((tempUsers) => {
        this.managerUsersLookup = tempUsers;
      });
      this.loadingService.hide();
    }
    this.loadBranches();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(BranchFormComponent, {
      width: '600px',
      data: { mode: 'add', managerUsersLookup: this.managerUsersLookup },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.loadingService.show();
        await this.branchService.addBranch(result); // Add branch to Firestore
        this.loadingService.hide();
        this.loadBranches(); // Reload branches
      }
    });
  }
  openEditDialog(branch: any) {
    const dialogRef = this.dialog.open(BranchFormComponent, {
      width: '600px',
      data: { mode: 'edit', branch, managerUsersLookup: this.managerUsersLookup },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this.loadingService.show();
        result.branchid = branch.branchid;
        await this.branchService.updateBranch(result);
        this.loadingService.hide();
        this.loadBranches();
      }
    });
  }

  async loadBranches(): Promise<void> {
    this.loadingService.show();
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
      alert('Error loading branches');
    }
    this.loadingService.hide();
  }
  openDeleteDialog(branch: Branch) {
    const dialogRef = this.dialog.open(GlobalDeleteConfirmationComponent, {
      width: '300px',
      data: {
        title: 'Delete Role',
        message: `Are you sure you want to delete "${branch.name}"?`,
      },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        if (branch.branchid) {
          this.loadingService.show();
          await this.branchService.deleteBranch(branch.branchid);
          this.loadingService.hide();
          this.loadBranches();
        }
      }
    });
  }
}
