import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { privilegeKey } from '../auth/privilege-catalog';
import { isStatus, Status } from '../enums/status.enum';
import { ApplicationId, PrivilegeFunction, PrivilegeModule } from '../enums/privilege.enum';
import { AuthSession, SessionBranch } from '../Models/AuthSession';
import { BranchService } from './branchservice.service';
import { GroupPrivilegeService } from './group-privilege.service';
import { RoleService } from './role.service';
import { UserBranchAssociationService, ALL_BRANCHES_ID } from './user-branch-association.service';
import { UserGroupAssociationService } from './user-group-association.service';
import { UserGroupService } from './user-group.service';
import { UsersService } from './users.service';

export interface LoginResult {
  ok: boolean;
  chooseBranch: boolean;
  branches: SessionBranch[];
}

const SESSION_KEY = 'ims.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(this.readSession());
  readonly session$ = this.sessionSubject.asObservable();
  private pending: AuthSession | null = null;

  constructor(
    private usersService: UsersService,
    private roleService: RoleService,
    private groupService: UserGroupService,
    private associationService: UserGroupAssociationService,
    private groupPrivilegeService: GroupPrivilegeService,
    private branchService: BranchService,
    private branchAssociationService: UserBranchAssociationService,
  ) {
    if (this.sessionSubject.value) {
      void this.refreshAccess();
    }
  }

  isAuthenticated(): boolean {
    return this.sessionSubject.value !== null;
  }

  currentSession(): AuthSession | null {
    return this.sessionSubject.value;
  }

  currentUserId(): string {
    return this.sessionSubject.value?.userid || '';
  }

  currentBranchId(): string {
    return this.sessionSubject.value?.branchid || '';
  }

  hasPrivilege(moduleId: PrivilegeModule, functionId: PrivilegeFunction): boolean {
    const keys = this.sessionSubject.value?.privileges || [];
    return keys.includes(privilegeKey({ applicationId: ApplicationId.Ims, moduleId, functionId }));
  }

  async ensurePrivileges(): Promise<void> {
    const session = this.sessionSubject.value;
    if (!session) {
      return;
    }
    if (session.privileges) {
      return;
    }
    await this.refreshAccess();
  }

  hasAnyGroup(names: string[]): boolean {
    const owned = (this.sessionSubject.value?.groups || []).map((name) => name.toLowerCase());
    return names.some((name) => owned.includes(name.toLowerCase()));
  }

  /** identifier is an email or a username */
  async login(identifier: string, password: string): Promise<LoginResult> {
    const user = await this.usersService.authenticate(identifier, password);
    if (!user?.userid) {
      return { ok: false, chooseBranch: false, branches: [] };
    }
    const [roles, groups, associations, hasAssociations, branches] = await Promise.all([
      this.roleService.getRoles(),
      this.groupService.getGroups(),
      this.associationService.getByUser(user.userid),
      this.associationService.hasAny(),
      this.availableBranches(user.userid),
    ]);
    const roleName = roles.find((role) => role.id === user.roleid)?.name || '';
    const groupIds = associations.map((association) => association.groupid);
    const groupNames = associations
      .map((association) => groups.find((group) => group.id === association.groupid)?.name || '')
      .filter((name) => name.length > 0);
    const privilegeKeys = await this.privilegeKeys(groupIds);
    const chosen = branches.length === 1 ? branches[0] : undefined;
    const session: AuthSession = {
      userid: user.userid,
      name: user.name,
      username: user.username,
      email: user.email,
      roleid: user.roleid,
      roleName,
      branchid: chosen?.branchid || '',
      branchName: chosen?.name || '',
      branches,
      groups: groupNames,
      canAdminister: this.canAdminister(groupNames, hasAssociations),
      canApprove: associations.some((association) =>
        groups.some((group) => group.id === association.groupid && group.canApprove),
      ),
      privileges: privilegeKeys,
    };
    if (branches.length > 1) {
      this.pending = session;
      return { ok: true, chooseBranch: true, branches };
    }
    this.pending = null;
    this.persist(session);
    return { ok: true, chooseBranch: false, branches };
  }

  selectBranch(branchid: string): boolean {
    const source = this.pending || this.sessionSubject.value;
    const branch = (source?.branches || []).find((item) => item.branchid === branchid);
    if (!source || !branch) {
      return false;
    }
    this.pending = null;
    this.persist({ ...source, branchid: branch.branchid, branchName: branch.name });
    return true;
  }

  async refreshAccess(): Promise<void> {
    const current = this.sessionSubject.value;
    if (!current) {
      return;
    }
    const [groups, associations, hasAssociations, branches] = await Promise.all([
      this.groupService.getGroups(),
      this.associationService.getByUser(current.userid),
      this.associationService.hasAny(),
      this.availableBranches(current.userid),
    ]);
    const groupIds = associations.map((association) => association.groupid);
    const groupNames = associations
      .map((association) => groups.find((group) => group.id === association.groupid)?.name || '')
      .filter((name) => name.length > 0);
    const selected =
      branches.find((branch) => branch.branchid === current.branchid) ||
      (branches.length === 1 ? branches[0] : undefined);
    this.persist({
      ...current,
      branchid: selected?.branchid || '',
      branchName: selected?.name || '',
      branches,
      groups: groupNames,
      canAdminister: this.canAdminister(groupNames, hasAssociations),
      canApprove: associations.some((association) =>
        groups.some((group) => group.id === association.groupid && group.canApprove),
      ),
      privileges: await this.privilegeKeys(groupIds),
    });
  }

  canApproveRequests(): boolean {
    return !!this.sessionSubject.value?.canApprove;
  }

  private async availableBranches(userid: string): Promise<SessionBranch[]> {
    const [links, branches] = await Promise.all([
      this.branchAssociationService.getByUser(userid),
      this.branchService.getBranches(),
    ]);
    const active = branches.filter((branch) => !isStatus(branch.status, Status.Inactive));
    const allowed = links.some((link) => link.branchid === ALL_BRANCHES_ID)
      ? active
      : active.filter((branch) => links.some((link) => link.branchid === branch.branchid));
    return allowed.map((branch) => ({ branchid: branch.branchid, name: branch.name }));
  }

  private async privilegeKeys(groupIds: string[]): Promise<string[]> {
    const grants = await this.groupPrivilegeService.getEnabledForGroups(groupIds);
    return [...new Set(grants.map((grant) => privilegeKey(grant)))];
  }

  logout(): void {
    this.pending = null;
    sessionStorage.removeItem(SESSION_KEY);
    this.sessionSubject.next(null);
  }

  private canAdminister(groups: string[], hasAssociations: boolean): boolean {
    const isAdmin = groups.some((name) => name.toLowerCase() === 'admin');
    return isAdmin || !hasAssociations;
  }

  private persist(session: AuthSession): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.sessionSubject.next(session);
  }

  private readSession(): AuthSession | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      const session = JSON.parse(raw) as AuthSession;
      session.branches = session.branches || [];
      session.branchName = session.branchName || '';
      session.canApprove = !!session.canApprove;
      return session;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}
