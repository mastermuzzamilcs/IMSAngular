import { Injectable } from '@angular/core';
import { isStatus, Status } from '../enums/status.enum';
import { UserGroupAssociationService } from '../services/user-group-association.service';
import { UsersService } from '../services/users.service';
import { NotificationAudience, NotificationTemplate } from './notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationAudienceResolver {
  constructor(
    private usersService: UsersService,
    private associationService: UserGroupAssociationService,
  ) {}

  async resolve(template: NotificationTemplate): Promise<string[]> {
    const users = await this.usersService.getUsers();
    const active = new Set(
      users
        .filter((user) => user.userid && !isStatus(user.status, Status.Inactive))
        .map((user) => user.userid as string),
    );
    if (template.audience === NotificationAudience.Public) {
      return [...active];
    }
    if (template.audience === NotificationAudience.CustomUsers) {
      return template.userIds.filter((id) => active.has(id));
    }
    const selectedGroups = new Set(template.groupIds);
    const associations = await this.associationService.getAssociations();
    return [
      ...new Set(
        associations
          .filter((item) => selectedGroups.has(item.groupid))
          .map((item) => item.userid)
          .filter((id) => active.has(id)),
      ),
    ];
  }
}
