export interface User {
  userid?: string;
  name: string;
  email: string;
  roleid: string;
  role: string;
  manager: string;
  branch: string;
  branchid: string;
  status: 'Active' | 'Inactive';
}
