import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { AuthFacade } from '../facades/auth.facade';
import { LoginRequestDto } from '../dto/login-request.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { AuthTransformer } from '../transformers/auth.transformer';

@Injectable()
export class AuthProvider {
  constructor(
    private readonly authFacade: AuthFacade,
  ) {}

  async login(loginDto: LoginRequestDto, response: Response): Promise<LoginResponseDto> {
    const loginResult = await this.authFacade.login(loginDto);
    
    // Set cookie with auth token
    response.cookie('authToken', loginResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: loginResult.expiresIn * 1000, // Convert to milliseconds
    });

    return AuthTransformer.toLoginResponseDto(loginResult);
  }

  async logout(response: Response): Promise<void> {
    response.clearCookie('authToken');
  }
}
