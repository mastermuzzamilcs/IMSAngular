import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MxButtonComponent, MxCardComponent, MxPageHeaderComponent } from '@mesix/custom-control';
import {
  CatalogPrivilege,
  privilegeCatalog,
  privilegeKey,
  privileges as privilegeAccess,
} from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { isStatus, Status } from '../../../core/enums/status.enum';
import { UserGroup } from '../../../core/Models/UserGroupModel';
import { AuthService } from '../../../core/services/auth.service';
import { GroupPrivilegeService } from '../../../core/services/group-privilege.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { UserGroupService } from '../../../core/services/user-group.service';
import { ToastService } from '../../../core/services/toast.service';

interface PrivilegeSection {
  name: string;
  items: CatalogPrivilege[];
}

@Component({
  selector: 'app-group-privileges',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxCardComponent,
    PrivilegeDirective,
  ],
  templateUrl: './group-privileges.component.html',
  styleUrl: './group-privileges.component.scss',
})
export class GroupPrivilegesComponent implements OnInit {
  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  groups: UserGroup[] = [];
  sections: PrivilegeSection[] = [];
  selected = new Set<string>();
  groupForm;

  constructor(
    private fb: FormBuilder,
    private groupService: UserGroupService,
    private privilegeService: GroupPrivilegeService,
    private auth: AuthService,
    private loadingService: LoadingService,
  ) {
    this.groupForm = this.fb.group({
      groupid: ['', Validators.required],
    });
    this.sections = this.buildSections();
  }

  async ngOnInit(): Promise<void> {
    this.loadingService.show();
    try {
      const groups = await this.groupService.getGroups();
      this.groups = groups.filter((group) => !isStatus(group.status, Status.Inactive));
      const admin = this.groups.find((group) => group.name.toLowerCase() === 'admin');
      const groupid = admin?.id || this.groups[0]?.id || '';
      this.groupForm.patchValue({ groupid });
      if (groupid) {
        await this.loadGroup(groupid);
      }
    } catch (error) {
      console.error('Error loading group privileges', error);
      this.toast.error('Error loading group privileges');
    }
    this.loadingService.hide();
  }

  async onGroupChange(): Promise<void> {
    const groupid = this.groupForm.value.groupid || '';
    if (!groupid) {
      this.selected.clear();
      return;
    }
    this.loadingService.show();
    try {
      await this.loadGroup(groupid);
    } catch (error) {
      console.error('Error loading privileges for group', error);
      this.toast.error('Error loading privileges for this group');
    }
    this.loadingService.hide();
  }

  isChecked(item: CatalogPrivilege): boolean {
    return this.selected.has(privilegeKey(item));
  }

  toggle(item: CatalogPrivilege, checked: boolean): void {
    const key = privilegeKey(item);
    if (checked) {
      this.selected.add(key);
      return;
    }
    this.selected.delete(key);
  }

  async save(): Promise<void> {
    const groupid = this.groupForm.value.groupid || '';
    if (!groupid) {
      return;
    }
    const selected = privilegeCatalog.filter((item) => this.selected.has(privilegeKey(item)));
    this.loadingService.show();
    try {
      await this.privilegeService.saveGroup(groupid, selected);
      await this.auth.refreshAccess();
      this.toast.success('Group privileges saved');
    } catch (error) {
      console.error('Error saving group privileges', error);
      this.toast.error('Could not save group privileges');
    }
    this.loadingService.hide();
  }

  private async loadGroup(groupid: string): Promise<void> {
    const grants = await this.privilegeService.getForGroup(groupid);
    this.selected = new Set(
      grants.filter((grant) => grant.enabled).map((grant) => privilegeKey(grant)),
    );
  }

  private buildSections(): PrivilegeSection[] {
    const sections: PrivilegeSection[] = [];
    privilegeCatalog.forEach((item) => {
      const current = sections.find((section) => section.name === item.moduleName);
      if (current) {
        current.items.push(item);
        return;
      }
      sections.push({ name: item.moduleName, items: [item] });
    });
    return sections;
  }
}
