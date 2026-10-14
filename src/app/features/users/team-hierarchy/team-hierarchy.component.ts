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
import { privileges as privilegeAccess } from '../../../core/auth/privilege-catalog';
import { PrivilegeDirective } from '../../../core/auth/privilege.directive';
import { LoadingService } from '../../../core/services/Loading.service';
import {
  Users_team_hirearchy,
  UsersTeamHirearchyService,
} from '../../../core/services/users-team-hirearchy.service';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-team-hierarchy',
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
  templateUrl: './team-hierarchy.component.html',
})
export class TeamHierarchyComponent implements OnInit {
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
      alert('Error loading team hierarchy');
    }
    this.loadingService.hide();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const userid = this.form.value.userid || '';
    const reportingTo = this.form.value.reportingTo || '';
    if (userid === reportingTo) {
      alert('A user cannot report to themselves');
      return;
    }
    this.loadingService.show();
    try {
      await this.hierarchyService.save(userid, reportingTo);
      this.form.patchValue({ reportingTo: '' });
      await this.load();
    } catch (error) {
      console.error('Error saving team hierarchy', error);
      alert('Could not save the reporting relationship');
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
      await this.load();
    } catch (error) {
      console.error('Error removing team hierarchy', error);
      alert('Could not remove the reporting relationship');
      this.loadingService.hide();
    }
  }
}
