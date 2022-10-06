import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Admin } from '../interfaces/admin.interface';

export const GetTokenUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Admin => {
    const request = ctx.switchToHttp().getRequest();

    return request.user;
  },
);
