import { Status } from '../enums/status.enum';

export interface Brand {
  id?: string;
  name: string;
  alias: string;
  description: string;
  country: string;
  status: Status;
}
