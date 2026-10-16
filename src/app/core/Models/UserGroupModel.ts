import { Status } from '../enums/status.enum';

export interface UserGroup {
  id?: string;
  name: string;
  description: string;
  status: Status;
  /** Members of this group may act on workflow requests assigned to them. */
  canApprove: boolean;
}

export interface UserGroupAssociation {
  id?: string;
  userid: string;
  groupid: string;
  userName?: string;
  groupName?: string;
}
