import { Injectable } from '@angular/core';
import { isStatus, Status } from '../enums/status.enum';
import { ItemSourceEvaluator } from '../item-sources/item-source-evaluator';
import { WorkflowFunctionContext } from '../workflow/workflow-action';
import { UserGroupAssociationService } from './user-group-association.service';
import { UserGroupService } from './user-group.service';
import { UsersService } from './users.service';

@Injectable({ providedIn: 'root' })
export class RequestAssigneeService {
  constructor(
    private usersService: UsersService,
    private groupService: UserGroupService,
    private groupAssociationService: UserGroupAssociationService,
    private itemSourceEvaluator: ItemSourceEvaluator,
  ) {}

  /**
   * Resolves an item source to a single active user id (by userid, email, or name).
   */
  async resolveFromItemSource(
    sourceCode: string,
    context: WorkflowFunctionContext,
  ): Promise<string> {
    const code = (sourceCode || '').trim();
    if (!code) {
      return '';
    }
    const values = await this.itemSourceEvaluator.valuesFor([`{{${code}}}`], context);
    const matched = await this.matchUsers(values[code] || '');
    return matched[0] || '';
  }

  async userCanApprove(userId: string): Promise<boolean> {
    if (!userId) {
      return false;
    }
    const [groups, links] = await Promise.all([
      this.groupService.getGroups(),
      this.groupAssociationService.getByUser(userId),
    ]);
    return links.some((link) =>
      groups.some((group) => group.id === link.groupid && group.canApprove),
    );
  }

  private async matchUsers(value: string): Promise<string[]> {
    const users = (await this.usersService.getUsers()).filter(
      (user) => user.userid && !isStatus(user.status, Status.Inactive),
    );
    const parts = value
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    const ids: string[] = [];
    const seen = new Set<string>();
    parts.forEach((part) => {
      const lower = part.toLowerCase();
      users.forEach((user) => {
        const userid = user.userid || '';
        if (!userid || seen.has(userid)) {
          return;
        }
        if (
          userid === part ||
          user.email.trim().toLowerCase() === lower ||
          (user.username || '').trim().toLowerCase() === lower ||
          user.name.trim().toLowerCase() === lower
        ) {
          seen.add(userid);
          ids.push(userid);
        }
      });
    });
    return ids;
  }
}
