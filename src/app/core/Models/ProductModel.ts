import { Status } from '../enums/status.enum';

export interface Product {
  id?: string;
  name: string;
  brandId: string;
  brand: string;
  description: string;
  price: number;
  status: Status;
}
