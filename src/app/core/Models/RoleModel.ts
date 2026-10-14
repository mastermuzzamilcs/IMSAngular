import { Status } from '../enums/status.enum';

export interface Role {
  id?: string;
  name: string;
  description: string;
  status: Status;
}
