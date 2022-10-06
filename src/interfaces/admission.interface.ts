import { User } from './user.interface';

export interface Admission {
  _id?: string;
  name: string;
  phoneNo: string;
  project: string;
  user?: User;
  note?: string;
  date?: Date;
  dateString?: string;
  month?: number;
  type?: string;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdmissionTarget {
  _id?: string;
  project: string;
  user?: User;
  month?: number;
  amount: number;
  paid: number;
  admissions: string[] | Admission[];
  createdAt?: Date;
  updatedAt?: Date;
}
