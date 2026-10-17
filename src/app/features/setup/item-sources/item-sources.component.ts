import { ConfirmService } from '../../../core/services/confirm.service';
import { AfterViewInit, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  MxButtonComponent,
  MxEmptyStateComponent,
  MxGridComponent,
  MxPageHeaderComponent,
  MxNoticeService,
} from '@mesix/custom-control';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ItemSource } from '../../../core/item-sources/item-source.model';
import { LoadingService } from '../../../core/services/Loading.service';
import { ItemSourceService } from '../../../core/services/item-source.service';
import { ItemSourceFormComponent } from './item-source-form.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-item-sources',
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
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './item-sources.component.html',
  styleUrl: './item-sources.component.scss',
})
export class ItemSourcesComponent implements OnInit, AfterViewInit {
  private readonly notice = inject(MxNoticeService);
  private readonly confirm = inject(ConfirmService);

  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  displayedColumns = ['code', 'name', 'output', 'actions'];
  dataSource = new MatTableDataSource<ItemSource>([]);
  tableLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private itemSourceService: ItemSourceService,
    private loadingService: LoadingService,
  ) {}

  ngOnInit(): void {
    void this.loadSources();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onGridFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  async loadSources(): Promise<void> {
    this.tableLoading = true;
    try {
      this.dataSource.data = await this.itemSourceService.getSources();
    } catch (error) {
      console.error('Error loading item sources', error);
      this.toast.error('Error loading item sources');
    } finally {
      this.tableLoading = false;
    }
  }

  openAddDialog(): void {
    this.notice
      .open(ItemSourceFormComponent, { data: { mode: 'add' } })
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
          this.toastFailure(error, 'Could not save the item source');
        } finally {
          this.loadingService.hide();
        }
      });
  }

  openEditDialog(source: ItemSource): void {
    this.notice
      .open(ItemSourceFormComponent, { data: { mode: 'edit', source } })
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
          this.toastFailure(error, 'Could not save the item source');
        } finally {
          this.loadingService.hide();
        }
      });
  }

  openDeleteDialog(source: ItemSource): void {
    this.confirm
      .confirmDelete(`Are you sure you want to delete "${source.name}"?`, 'Delete Item Source')
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
          this.toast.error('Could not delete the item source');
        } finally {
          this.loadingService.hide();
        }
      });
  }

  private toastFailure(error: unknown, fallback: string): void {
    const message = error instanceof Error ? error.message : fallback;
    if (message.toLowerCase().includes('already exists')) {
      this.toast.warning(message);
    } else {
      this.toast.error(message);
    }
  }
}
