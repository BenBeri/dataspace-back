import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserSession } from '../models/user-session.model';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserSession => {
    const request = ctx.switchToHttp().getRequest();
    const response = ctx.switchToHttp().getResponse();
    
    // Check if userSession is on response (set by AuthGuard)
    if (response.userSession) {
      return response.userSession;
    }
    
    // Fallback to request.user (set by Passport)
    return request.user;
  },
);
