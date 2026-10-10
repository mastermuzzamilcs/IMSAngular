import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { privilegeKey } from '../auth/privilege-catalog';
import { ApplicationId, PrivilegeFunction, PrivilegeModule } from '../enums/privilege.enum';
import { AuthSession } from '../Models/AuthSession';
import { GroupPrivilegeService } from './group-privilege.service';
import { RoleService } from './role.service';
import { UserGroupAssociationService } from './user-group-association.service';
import { UserGroupService } from './user-group.service';
import { UsersService } from './users.service';

const SESSION_KEY = 'ims.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(this.readSession());
  readonly session$ = this.sessionSubject.asObservable();

  constructor(
    private usersService: UsersService,
    private roleService: RoleService,
    private groupService: UserGroupService,
    private associationService: UserGroupAssociationService,
    private groupPrivilegeService: GroupPrivilegeService,
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

  async login(email: string, password: string): Promise<boolean> {
    const user = await this.usersService.authenticate(email, password);
    if (!user?.userid) {
      return false;
    }
    const [roles, groups, associations, hasAssociations] = await Promise.all([
      this.roleService.getRoles(),
      this.groupService.getGroups(),
      this.associationService.getByUser(user.userid),
      this.associationService.hasAny(),
    ]);
    const roleName = roles.find((role) => role.id === user.roleid)?.name || '';
    const groupIds = associations.map((association) => association.groupid);
    const groupNames = associations
      .map((association) => groups.find((group) => group.id === association.groupid)?.name || '')
      .filter((name) => name.length > 0);
    const privilegeKeys = await this.privilegeKeys(groupIds);
    const session: AuthSession = {
      userid: user.userid,
      name: user.name,
      email: user.email,
      roleid: user.roleid,
      roleName,
      branchid: user.branchid,
      groups: groupNames,
      canAdminister: this.canAdminister(groupNames, hasAssociations),
      privileges: privilegeKeys,
    };
    this.persist(session);
    return true;
  }

  async refreshAccess(): Promise<void> {
    const current = this.sessionSubject.value;
    if (!current) {
      return;
    }
    const [groups, associations, hasAssociations] = await Promise.all([
      this.groupService.getGroups(),
      this.associationService.getByUser(current.userid),
      this.associationService.hasAny(),
    ]);
    const groupIds = associations.map((association) => association.groupid);
    const groupNames = associations
      .map((association) => groups.find((group) => group.id === association.groupid)?.name || '')
      .filter((name) => name.length > 0);
    this.persist({
      ...current,
      groups: groupNames,
      canAdminister: this.canAdminister(groupNames, hasAssociations),
      privileges: await this.privilegeKeys(groupIds),
    });
  }

  private async privilegeKeys(groupIds: string[]): Promise<string[]> {
    const grants = await this.groupPrivilegeService.getEnabledForGroups(groupIds);
    return [...new Set(grants.map((grant) => privilegeKey(grant)))];
  }

  logout(): void {
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
      return JSON.parse(raw) as AuthSession;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}
