import { Injectable } from '@angular/core';
import { isStatus, Status } from '../enums/status.enum';
import { ItemSourceEvaluator } from '../item-sources/item-source-evaluator';
import { User } from '../Models/UsersModel';
import { UserGroupAssociationService } from '../services/user-group-association.service';
import { UsersService } from '../services/users.service';
import { WorkflowFunctionContext } from '../workflow/workflow-action';
import { NotificationTemplate } from './notification.model';
import {
  ALL_BRANCHES_ID,
  UserBranchAssociationService,
} from '../services/user-branch-association.service';

@Injectable({ providedIn: 'root' })
export class NotificationAudienceResolver {
  constructor(
    private usersService: UsersService,
    private associationService: UserGroupAssociationService,
    private branchAssociationService: UserBranchAssociationService,
    private itemSourceEvaluator: ItemSourceEvaluator,
  ) {}

  async resolve(
    template: NotificationTemplate,
    context: WorkflowFunctionContext,
  ): Promise<string[]> {
    const users = await this.usersService.getUsers();
    const active = users.filter(
      (user) => user.userid && !isStatus(user.status, Status.Inactive),
    );
    const activeIds = new Set(active.map((user) => user.userid as string));
    const recipients = new Set<string>();
    if (template.includePublic) {
      activeIds.forEach((id) => recipients.add(id));
    }
    template.userIds.filter((id) => activeIds.has(id)).forEach((id) => recipients.add(id));
    if (template.groupIds.length) {
      const selectedGroups = new Set(template.groupIds);
      const associations = await this.associationService.getAssociations();
      associations
        .filter((item) => selectedGroups.has(item.groupid) && activeIds.has(item.userid))
        .forEach((item) => recipients.add(item.userid));
    }
    if (template.audienceSources.length) {
      const values = await this.itemSourceEvaluator.valuesFor(
        template.audienceSources.map((code) => `{{${code}}}`),
        context,
      );
      template.audienceSources.forEach((code) => {
        this.matchUsers(values[code] || '', active).forEach((id) => recipients.add(id));
      });
    }
    const templateBranch = template.branchid || ALL_BRANCHES_ID;
    if (templateBranch === ALL_BRANCHES_ID) {
      return [...recipients];
    }
    const allowed = await this.usersForBranch(templateBranch);
    return [...recipients].filter((id) => allowed.has(id));
  }

  private matchUsers(value: string, users: User[]): string[] {
    const parts = value
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    const ids = new Set<string>();
    parts.forEach((part) => {
      const lower = part.toLowerCase();
      users.forEach((user) => {
        const userid = user.userid || '';
        if (!userid) {
          return;
        }
        if (
          userid === part ||
          user.email.trim().toLowerCase() === lower ||
          user.name.trim().toLowerCase() === lower
        ) {
          ids.add(userid);
        }
      });
    });
    return [...ids];
  }

  private async usersForBranch(branchId: string): Promise<Set<string>> {
    const links = await this.branchAssociationService.getAssociations();
    return new Set(
      links
        .filter((link) => link.branchid === branchId || link.branchid === ALL_BRANCHES_ID)
        .map((link) => link.userid),
    );
  }
}
