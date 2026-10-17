import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import {
  MxButtonComponent,
  MxCardComponent,
  MxEmptyStateComponent,
  MxPageHeaderComponent,
} from '@mesix/custom-control';
import { isStatus, Status } from '../../../core/enums/status.enum';
import { User } from '../../../core/Models/UsersModel';
import { UserGroup, UserGroupAssociation } from '../../../core/Models/UserGroupModel';
import { AuthService } from '../../../core/services/auth.service';
import { LoadingService } from '../../../core/services/Loading.service';
import { UserGroupAssociationService } from '../../../core/services/user-group-association.service';
import { UserGroupService } from '../../../core/services/user-group.service';
import { UsersService } from '../../../core/services/users.service';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-group-associations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MxPageHeaderComponent,
    MxButtonComponent,
    MxCardComponent,
    MxEmptyStateComponent,
    PrivilegeDirective,
  ],
  templateUrl: './group-associations.component.html',
})
export class GroupAssociationsComponent implements OnInit {
  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  users: User[] = [];
  groups: UserGroup[] = [];
  associations: UserGroupAssociation[] = [];
  displayedColumns = ['userName', 'groupName', 'actions'];
  associationForm;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private groupService: UserGroupService,
    private associationService: UserGroupAssociationService,
    private auth: AuthService,
    private loadingService: LoadingService,
  ) {
    this.associationForm = this.fb.group({
      userid: ['', Validators.required],
      groupid: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const currentUserId = this.auth.currentUserId();
    if (currentUserId) {
      this.associationForm.patchValue({ userid: currentUserId });
    }
    this.load();
  }

  async load(): Promise<void> {
    this.loadingService.show();
    try {
      const [users, groups, associations] = await Promise.all([
        this.usersService.getUsers(),
        this.groupService.getGroups(true),
        this.associationService.getAssociations(),
      ]);
      this.users = users;
      this.groups = groups.filter((group) => !isStatus(group.status, Status.Inactive));
      const admin = this.groups.find((group) => group.name.toLowerCase() === 'admin');
      if (admin && !this.associationForm.value.groupid) {
        this.associationForm.patchValue({ groupid: admin.id });
      }
      this.associations = associations.map((association) => ({
        ...association,
        userName:
          users.find((user) => user.userid === association.userid)?.name || association.userid,
        groupName:
          groups.find((group) => group.id === association.groupid)?.name || association.groupid,
      }));
    } catch (error) {
      console.error('Error loading group associations', error);
      this.toast.error('Error loading group associations');
    } finally {
      this.loadingService.hide();
    }
  }

  async associate(): Promise<void> {
    if (this.associationForm.invalid) {
      this.associationForm.markAllAsTouched();
      return;
    }
    const userid = this.associationForm.value.userid || '';
    const groupid = this.associationForm.value.groupid || '';
    if (this.associations.some((item) => item.userid === userid && item.groupid === groupid)) {
      const userName = this.users.find((user) => user.userid === userid)?.name || 'This user';
      const groupName = this.groups.find((group) => group.id === groupid)?.name || 'this group';
      this.toast.warning(`${userName} is already associated with ${groupName}`);
      return;
    }
    this.loadingService.show();
    try {
      await this.associationService.associate(userid, groupid);
      await this.auth.refreshAccess();
      this.toast.success('User associated with group');
      await this.load();
    } catch (error) {
      console.error('Error associating user', error);
      const message = error instanceof Error ? error.message : 'Could not associate the user';
      if (message.toLowerCase().includes('already associated')) {
        this.toast.warning(message);
      } else {
        this.toast.error(message);
      }
    } finally {
      this.loadingService.hide();
    }
  }

  async disassociate(association: UserGroupAssociation): Promise<void> {
    if (!association.id) {
      return;
    }
    this.loadingService.show();
    try {
      await this.associationService.disassociate(association.id);
      await this.auth.refreshAccess();
      this.toast.success('User disassociated from group');
      await this.load();
    } catch (error) {
      console.error('Error removing association', error);
      this.toast.error('Could not remove the association');
    } finally {
      this.loadingService.hide();
    }
  }
}
