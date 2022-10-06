import { User } from './user.interface';

export interface Standup {
  _id?: string;
  user?: User;
  note?: string;
  date?: Date;
  dateString?: string;
  month?: number;
  type?: string;
  isJoined?: boolean;
  dateNum?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
