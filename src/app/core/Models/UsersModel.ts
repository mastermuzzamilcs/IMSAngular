import { Status } from '../enums/status.enum';

export interface User {
  userid?: string;
  name: string;
  email: string;
  roleid: string;
  role: string;
  manager: string;
  branch: string;
  branchid: string;
  status: Status;
  password?: string;
}
