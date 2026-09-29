import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Role } from '../../../core/Models/RoleModel';
import { RoleService } from '../../../core/services/role.service';
import { RolesFormComponent } from '../roles-form/roles-form.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LoadingService } from '../../../core/services/Loading.service';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { GlobalDeleteConfirmationComponent } from '../../../shared/components/global-delete-confirmation/global-delete-confirmation.component';
import { MatSort, MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-roles',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatChipsModule,
    MatSortModule,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
  standalone: true,
})
export class RolesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'description', 'status', 'actions'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private roleService: RoleService,
    private _loadingService: LoadingService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.loadRoles();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  async loadRoles() {
    this._loadingService.show();
    try {
      const roles = await this.roleService.getRoles();
      this.dataSource.data = roles;
    } catch (err) {
      console.error('Error loading User Roles', err);
      alert('Error loading User Roles');
    }
    this._loadingService.hide();
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(RolesFormComponent, {
      width: '500px',
      data: { mode: 'add' },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this._loadingService.show();
        await this.roleService.addRole(result);
        this._loadingService.hide();
        this.loadRoles();
      }
    });
  }

  openEditDialog(role: Role) {
    const dialogRef = this.dialog.open(RolesFormComponent, {
      width: '500px',
      data: { mode: 'edit', role },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        this._loadingService.show();
        result.id = role.id;
        await this.roleService.updateRole(result);
        this._loadingService.hide();
        this.loadRoles();
      }
    });
  }
  openDeleteDialog(role: Role) {
    const dialogRef = this.dialog.open(GlobalDeleteConfirmationComponent, {
      width: '300px',
      data: {
        title: 'Delete Role',
        message: `Are you sure you want to delete "${role.name}"?`,
      },
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        if (role.id) {
          this._loadingService.show();
          await this.roleService.deleteRole(role.id);
          this._loadingService.hide();
          this.loadRoles();
        }
      }
    });
  }
}
