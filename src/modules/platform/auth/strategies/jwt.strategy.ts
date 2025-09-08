import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthFacade } from '../facades/auth.facade';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authFacade: AuthFacade,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to extract from Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Then try to extract from cookie
        (request: Request) => {
          return request?.cookies?.authToken || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'default-secret-key'),
    });
  }

  async validate(payload: any) {
    try {
      // Validate and fetch the user
      const user = await this.authFacade.validateUser(payload.sub);
      
      // Ensure user exists
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // Create user session
      const userSession = await this.authFacade.createUserSession(user);
      
      // Return the session which will be attached to the request
      return userSession;
    } catch (error) {
      // If any error occurs during validation, throw UnauthorizedException
      throw new UnauthorizedException('Invalid token or user not found');
    }
  }
}
