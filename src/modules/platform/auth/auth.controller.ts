import { Controller, Post, Body, Res, HttpStatus, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import { AuthProvider } from './providers/auth.provider';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authProvider: AuthProvider,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponseDto> {
    return await this.authProvider.login(loginDto, response);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response): Promise<{ message: string }> {
    await this.authProvider.logout(response);
    return { message: 'Logged out successfully' };
  }
}
