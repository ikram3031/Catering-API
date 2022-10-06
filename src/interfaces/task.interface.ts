import { Project } from './project.interface';
import { Admin } from './admin.interface';
import { User } from './user.interface';
import { Tag } from './tag.interface';

export interface Task {
  _id?: string;
  title: string;
  description?: string;
  project?: Project;
  assignDate?: Date;
  assignDateString?: string;
  dueDate?: Date;
  dueDateString?: string;
  assignBy?: Admin;
  assignTo?: User[];
  note?: string;
  attachment?: any;
  tag?: Tag;
  list?: TaskList[];
  expectedList?: TaskList[]; // Additional for Logic
  isDone?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  totalExpectedTime?: number;
  totalActualTime?: number;
}

export interface TaskList {
  _id?: string;
  name?: string;
  status?: string;
  checked?: boolean;
  expectedTimeInMinute?: number;
  actualTimeInMinute?: number;
  user?: string;
  endDate?: string;
  startDate?: string;
  note?: string;
}
