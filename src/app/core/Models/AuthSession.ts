export interface AuthSession {
  userid: string;
  name: string;
  email: string;
  roleid: string;
  roleName: string;
  branchid: string;
  groups: string[];
  canAdminister: boolean;
  privileges?: string[];
  privilegeVersion?: number;
}
