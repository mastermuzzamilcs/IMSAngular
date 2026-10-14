import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
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

@Component({
  selector: 'app-group-associations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    PrivilegeDirective,
  ],
  templateUrl: './group-associations.component.html',
})
export class GroupAssociationsComponent implements OnInit {
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
      alert('Error loading group associations');
    }
    this.loadingService.hide();
  }

  async associate(): Promise<void> {
    if (this.associationForm.invalid) {
      this.associationForm.markAllAsTouched();
      return;
    }
    const userid = this.associationForm.value.userid || '';
    const groupid = this.associationForm.value.groupid || '';
    this.loadingService.show();
    try {
      await this.associationService.associate(userid, groupid);
      await this.auth.refreshAccess();
      await this.load();
    } catch (error) {
      console.error('Error associating user', error);
      alert('Could not associate the user');
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
      await this.load();
    } catch (error) {
      console.error('Error removing association', error);
      alert('Could not remove the association');
      this.loadingService.hide();
    }
  }
}
