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
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { LoadingService } from '../../../core/services/Loading.service';
import {
  Users_team_hirearchy,
  UsersTeamHirearchyService,
} from '../../../core/services/users-team-hirearchy.service';
import { UsersService } from '../../../core/services/users.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-team-hierarchy',
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
  templateUrl: './team-hierarchy.component.html',
})
export class TeamHierarchyComponent implements OnInit {
  private readonly toast = inject(ToastService);

  readonly privileges = privilegeAccess;
  users: User[] = [];
  rows: Users_team_hirearchy[] = [];
  displayedColumns = ['userName', 'reportingToName', 'actions'];
  form;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private hierarchyService: UsersTeamHirearchyService,
    private loadingService: LoadingService,
  ) {
    this.form = this.fb.group({
      userid: ['', Validators.required],
      reportingTo: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    void this.load();
  }

  reportingChoices(userid: string): User[] {
    return this.users.filter((user) => user.userid !== userid);
  }

  async load(): Promise<void> {
    this.loadingService.show();
    try {
      const [users, rows] = await Promise.all([
        this.usersService.getUsers(),
        this.hierarchyService.getAll(),
      ]);
      this.users = users.filter((user) => isStatus(user.status, Status.Active));
      const nameOf = (userid: string) =>
        users.find((user) => user.userid === userid)?.name || userid;
      this.rows = rows.map((row) => ({
        ...row,
        userName: nameOf(row.userid),
        reportingToName: nameOf(row.reportingTo),
      }));
    } catch (error) {
      console.error('Error loading team hierarchy', error);
      this.toast.error('Error loading team hierarchy');
    } finally {
      this.loadingService.hide();
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const userid = this.form.value.userid || '';
    const reportingTo = this.form.value.reportingTo || '';
    if (userid === reportingTo) {
      this.toast.warning('A user cannot report to themselves');
      return;
    }
    this.loadingService.show();
    try {
      await this.hierarchyService.save(userid, reportingTo);
      this.form.patchValue({ reportingTo: '' });
      this.toast.success('Reporting relationship saved');
      await this.load();
    } catch (error) {
      console.error('Error saving team hierarchy', error);
      this.toast.error(
        error instanceof Error ? error.message : 'Could not save the reporting relationship',
      );
    } finally {
      this.loadingService.hide();
    }
  }

  async remove(row: Users_team_hirearchy): Promise<void> {
    if (!row.id) {
      return;
    }
    this.loadingService.show();
    try {
      await this.hierarchyService.remove(row.id);
      this.toast.success('Reporting relationship removed');
      await this.load();
    } catch (error) {
      console.error('Error removing team hierarchy', error);
      this.toast.error('Could not remove the reporting relationship');
    } finally {
      this.loadingService.hide();
    }
  }
}
