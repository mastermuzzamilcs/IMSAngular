import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MxCardComponent, MxPageHeaderComponent } from '@mesix/custom-control';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { PrivilegeFunction, PrivilegeModule } from '../../../core/enums/privilege.enum';
import { ItemSource } from '../../../core/item-sources/item-source.model';
import { RequestTypeSetting } from '../../../core/Models/WorkflowModel';
import { AuthService } from '../../../core/services/auth.service';
import { ItemSourceService } from '../../../core/services/item-source.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { RequestTypeService } from '../../../core/services/request-type.service';

@Component({
  selector: 'app-request-types',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MxPageHeaderComponent, MxCardComponent,
    MatTableModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './request-types.component.html',
})
export class RequestTypesComponent implements OnInit {
  displayedColumns = ['requestType', 'assignedToSource', 'IS_Auto_Approve'];
  settings: RequestTypeSetting[] = [];
  itemSources: ItemSource[] = [];

  constructor(
    private requestTypeService: RequestTypeService,
    private itemSourceService: ItemSourceService,
    private loadingService: LoadingService,
    private auth: AuthService,
  ) {}

  get canEdit(): boolean {
    return this.auth.hasPrivilege(PrivilegeModule.WorkflowTransitions, PrivilegeFunction.Edit);
  }

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loadingService.show();
    try {
      const [settings, sources] = await Promise.all([
        this.requestTypeService.getSettings(),
        this.itemSourceService.getSources(),
      ]);
      this.settings = settings;
      this.itemSources = sources.slice().sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      console.error('Error loading request types', error);
      alert('Error loading request types');
    }
    this.loadingService.hide();
  }

  async setAutoApprove(setting: RequestTypeSetting, enabled: boolean): Promise<void> {
    const previous = setting.IS_Auto_Approve;
    setting.IS_Auto_Approve = enabled;
    this.loadingService.show();
    try {
      await this.requestTypeService.setAutoApprove(setting.requestType, enabled);
    } catch (error) {
      setting.IS_Auto_Approve = previous;
      console.error('Error saving auto approve', error);
      alert('Could not save auto approve');
    }
    this.loadingService.hide();
  }

  async setAssignedToSource(setting: RequestTypeSetting, sourceCode: string): Promise<void> {
    const previous = setting.assignedToSource;
    setting.assignedToSource = sourceCode || '';
    this.loadingService.show();
    try {
      await this.requestTypeService.setAssignedToSource(
        setting.requestType,
        setting.assignedToSource,
      );
    } catch (error) {
      setting.assignedToSource = previous;
      console.error('Error saving assigned to source', error);
      alert('Could not save Assigned to item source');
    }
    this.loadingService.hide();
  }

  sourceLabel(code: string): string {
    if (!code) {
      return 'Not set';
    }
    const source = this.itemSources.find((item) => item.code === code);
    return source ? `${source.code} â€” ${source.name}` : code;
  }
}
