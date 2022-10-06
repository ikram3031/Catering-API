import { SetMetadata } from '@nestjs/common';
import { USER_ROLES_KEY } from '../core/global-variables';
import { UserRoles } from '../enum/user-roles.enum';

export const UserMetaRoles = (...roles: UserRoles[]) =>
  SetMetadata(USER_ROLES_KEY, roles);
