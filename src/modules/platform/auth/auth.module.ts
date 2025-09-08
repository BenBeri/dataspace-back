import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthProvider } from './providers/auth.provider';
import { AuthFacade } from './facades/auth.facade';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthGuard } from './guards/auth.guard';
import { WorkspaceGuard } from './guards/workspace.guard';
import { RepositoryGuard } from './guards/repository.guard';
import { CaslPermissionHelper } from './helpers/casl-permission.helper';
import { WorkspaceValidationHelper } from './helpers/workspace-validation.helper';
import { CaslModule } from './casl/casl.module';
import { UsersModule } from '../users/users.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [
    UsersModule,
    CaslModule,
    forwardRef(() => WorkspaceModule),
    forwardRef(() => require('../repository/repository.module').RepositoryModule),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'default-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthProvider,
    AuthFacade,
    JwtStrategy,
    CaslPermissionHelper,
    WorkspaceValidationHelper,
    WorkspaceGuard,
    RepositoryGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [
    AuthFacade,
    JwtModule,
    CaslPermissionHelper,
    WorkspaceValidationHelper,
    WorkspaceGuard,
    RepositoryGuard,
  ],
})
export class AuthModule {}
