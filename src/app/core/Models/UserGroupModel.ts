import { Status } from '../enums/status.enum';

export interface UserGroup {
  id?: string;
  name: string;
  description: string;
  status: Status;
}

export interface UserGroupAssociation {
  id?: string;
  userid: string;
  groupid: string;
  userName?: string;
  groupName?: string;
}
