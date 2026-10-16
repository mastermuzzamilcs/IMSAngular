import { Status } from '../enums/status.enum';

export interface Vendor {
  id?: string;
  name: string;
  location: string;
  description: string;
  status: Status;
}
