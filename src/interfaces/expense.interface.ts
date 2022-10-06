import { Tag } from './tag.interface';
import { User } from './user.interface';
import { Admin } from './admin.interface';

export interface Expense {
  _id?: string;
  name: string;
  user?: User;
  admin?: Admin;
  image?: string;
  note?: Tag;
  date?: Date;
  dateString?: string;
  month?: number;
  type?: string;
  category?: string;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}
