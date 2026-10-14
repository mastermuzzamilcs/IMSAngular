export interface SessionBranch {
  branchid: string;
  name: string;
}

export interface AuthSession {
  userid: string;
  name: string;
  email: string;
  roleid: string;
  roleName: string;
  branchid: string;
  branchName: string;
  branches: SessionBranch[];
  groups: string[];
  canAdminister: boolean;
  /** True when any of the user's groups has canApprove. */
  canApprove: boolean;
  privileges?: string[];
  privilegeVersion?: number;
}
