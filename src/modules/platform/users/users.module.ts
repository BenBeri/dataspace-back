import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserProvider } from './providers/user.provider';
import { UserRepository } from './repositories/user.repository';
import { PasswordHashRepository } from './repositories/password-hash.repository';
import { PasswordHashService } from './services/password-hash.service';
import { PasswordHashHelper } from './helpers/password-hash.helper';
import { User } from '../entities/user/user.entity';
import { PasswordHash } from '../entities/user/password-hash.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, PasswordHash])],
  providers: [
    UsersService,
    UserProvider,
    UserRepository,
    PasswordHashRepository,
    PasswordHashService,
    PasswordHashHelper,
  ],
  controllers: [UsersController],
  exports: [
    UsersService,
    UserProvider,
    UserRepository,
    PasswordHashService,
    PasswordHashHelper,
  ],
})
export class UsersModule {}
