import { ProjectCategory } from './project-category.interface';
import { Technology } from './technology.interface';
import { Tag } from './tag.interface';

export interface Project {
  readOnly?: boolean;
  _id?: string;
  name: string;
  address?: string;
  phoneNo?: string;
  email?: string;
  description?: string;
  image?: string;
  category?: ProjectCategory;
  technologies?: Technology[];
  tag?: Tag;
  source?: string;
  country?: string;
  startDate?: string;
  deadline?: string;
  status?: string;
  totalValue?: number;
  monthlyValue?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
