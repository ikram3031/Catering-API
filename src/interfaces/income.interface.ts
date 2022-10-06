import { Tag } from './tag.interface';
import { Admin } from './admin.interface';
import { Project } from './project.interface';

export interface Income {
  _id?: string;
  name: string;
  project?: Project;
  admin?: Admin;
  image?: string;
  note?: Tag;
  date?: Date;
  dateString?: string;
  month?: number;
  type?: string;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}
