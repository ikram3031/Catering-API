import { Designation } from './designation.interface';
import { Technology } from './technology.interface';
import { UserRoles } from '../enum/user-roles.enum';

export interface User {
  _id?: string;
  name?: string;
  username?: string;
  phoneNo?: string;
  email?: string;
  password?: string;
  gender?: string;
  profileImg?: string;
  joinDate?: string;
  role?: 'admin' | 'manager' | 'user';
  designation?: Designation;
  technologies?: Technology[];
  hasAccess?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserAuthResponse {
  success: boolean;
  token?: string;
  tokenExpiredIn?: number;
  data?: any;
  message?: string;
}

export interface UserJwtPayload {
  _id?: string;
  username: string;
  role: any;
}
