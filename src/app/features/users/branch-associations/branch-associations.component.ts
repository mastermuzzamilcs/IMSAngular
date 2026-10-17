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
import { Branch } from '../../../core/Models/BranchModel';
import { User } from '../../../core/Models/UsersModel';
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { BranchService } from '../../../core/services/branchservice.service';
import { LoadingService } from '../../../core/services/Loading.service';
import {
  ALL_BRANCHES_ID,
  UserBranchAssociation,
  UserBranchAssociationService,
} from '../../../core/services/user-branch-association.service';
import { UsersService } from '../../../core/services/users.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-branch-associations',
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
  templateUrl: './branch-associations.component.html',
})
export class BranchAssociationsComponent implements OnInit {
  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  readonly allBranchesId = ALL_BRANCHES_ID;
  users: User[] = [];
  branches: Branch[] = [];
  associations: UserBranchAssociation[] = [];
  displayedColumns = ['userName', 'branchName', 'actions'];
  associationForm;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private branchService: BranchService,
    private associationService: UserBranchAssociationService,
    private loadingService: LoadingService,
  ) {
    this.associationForm = this.fb.group({
      userid: ['', Validators.required],
      branchid: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loadingService.show();
    try {
      const [users, branches, associations] = await Promise.all([
        this.usersService.getUsers(),
        this.branchService.getBranches(),
        this.associationService.getAssociations(),
      ]);
      this.users = users.filter((user) => isStatus(user.status, Status.Active));
      this.branches = branches.filter((branch) => !isStatus(branch.status, Status.Inactive));
      this.associations = associations.map((association) => ({
        ...association,
        userName:
          users.find((user) => user.userid === association.userid)?.name || association.userid,
        branchName: this.branchLabel(association.branchid, branches),
      }));
    } catch (error) {
      console.error('Error loading branch associations', error);
      this.toast.error('Error loading branch associations');
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
    const branchid = this.associationForm.value.branchid || '';
    if (this.associations.some((item) => item.userid === userid && item.branchid === branchid)) {
      const userName = this.users.find((user) => user.userid === userid)?.name || 'This user';
      this.toast.warning(`${userName} is already assigned to the selected branch`);
      return;
    }
    this.loadingService.show();
    try {
      await this.associationService.associate(userid, branchid);
      this.associationForm.patchValue({ branchid: '' });
      this.toast.success('Branch assigned to user');
      await this.load();
    } catch (error) {
      console.error('Error assigning branch', error);
      const message = error instanceof Error ? error.message : 'Could not assign the branch';
      if (message.toLowerCase().includes('already assigned')) {
        this.toast.warning(message);
      } else {
        this.toast.error(message);
      }
    } finally {
      this.loadingService.hide();
    }
  }

  async remove(association: UserBranchAssociation): Promise<void> {
    if (!association.id) {
      return;
    }
    this.loadingService.show();
    try {
      await this.associationService.disassociate(association.id);
      this.toast.success('Branch assignment removed');
      await this.load();
    } catch (error) {
      console.error('Error removing branch assignment', error);
      this.toast.error('Could not remove the branch assignment');
    } finally {
      this.loadingService.hide();
    }
  }

  private branchLabel(branchid: string, branches: Branch[]): string {
    if (branchid === ALL_BRANCHES_ID) {
      return 'All branches';
    }
    return branches.find((branch) => branch.branchid === branchid)?.name || branchid;
  }
}
