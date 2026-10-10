import { Status } from '../enums/status.enum';

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: Status;
}
