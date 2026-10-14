import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ItemSource } from '../../../core/item-sources/item-source.model';
import { LoadingService } from '../../../core/services/Loading.service';
import { ItemSourceService } from '../../../core/services/item-source.service';
import { GlobalDeleteConfirmationComponent } from '../../../shared/components/global-delete-confirmation/global-delete-confirmation.component';
import { ItemSourceFormComponent } from './item-source-form.component';

@Component({
  selector: 'app-item-sources',
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
    MatTooltipModule,
    PrivilegeDirective,
  ],
  templateUrl: './item-sources.component.html',
  styleUrl: './item-sources.component.scss',
})
export class ItemSourcesComponent implements OnInit, AfterViewInit {
  readonly privileges = privilegeAccess;
  displayedColumns = ['code', 'name', 'output', 'actions'];
  dataSource = new MatTableDataSource<ItemSource>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private itemSourceService: ItemSourceService,
    private loadingService: LoadingService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    void this.loadSources();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  async loadSources(): Promise<void> {
    this.loadingService.show();
    try {
      this.dataSource.data = await this.itemSourceService.getSources();
    } catch (error) {
      console.error('Error loading item sources', error);
      alert('Error loading item sources');
    }
    this.loadingService.hide();
  }

  openAddDialog(): void {
    this.dialog
      .open(ItemSourceFormComponent, { width: '980px', data: { mode: 'add' } })
      .afterClosed()
      .subscribe(async (result: ItemSource | undefined) => {
        if (!result) {
          return;
        }
        this.loadingService.show();
        try {
          await this.itemSourceService.addSource(result);
          await this.loadSources();
        } catch (error) {
          console.error('Error adding item source', error);
          alert(error instanceof Error ? error.message : 'Could not save the item source');
          this.loadingService.hide();
        }
      });
  }

  openEditDialog(source: ItemSource): void {
    this.dialog
      .open(ItemSourceFormComponent, { width: '980px', data: { mode: 'edit', source } })
      .afterClosed()
      .subscribe(async (result: ItemSource | undefined) => {
        if (!result || !source.id) {
          return;
        }
        this.loadingService.show();
        try {
          await this.itemSourceService.updateSource({ ...result, id: source.id });
          await this.loadSources();
        } catch (error) {
          console.error('Error updating item source', error);
          alert(error instanceof Error ? error.message : 'Could not save the item source');
          this.loadingService.hide();
        }
      });
  }

  openDeleteDialog(source: ItemSource): void {
    this.dialog
      .open(GlobalDeleteConfirmationComponent, {
        width: '360px',
        data: {
          title: 'Delete Item Source',
          message: `Are you sure you want to delete "${source.name}"?`,
        },
      })
      .afterClosed()
      .subscribe(async (confirmed: boolean) => {
        if (!confirmed || !source.id) {
          return;
        }
        this.loadingService.show();
        try {
          await this.itemSourceService.deleteSource(source.id);
          await this.loadSources();
        } catch (error) {
          console.error('Error deleting item source', error);
          alert('Could not delete the item source');
          this.loadingService.hide();
        }
      });
  }
}
