import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {UsersModule} from "./users/users.module";
import {WorkspaceModule} from "./workspace/workspace.module";
import {RepositoryModule} from "./repository/repository.module";
import {AuthModule} from "./auth/auth.module";
import {KeyManagementModule} from "./key-management/key-management.module";
import {SharedModule} from "./shared/shared.module";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    SharedModule,
    AuthModule,
    UsersModule,
    WorkspaceModule,
    RepositoryModule,
    KeyManagementModule,
  ],
  controllers: [],
  providers: [],
  exports: [KeyManagementModule],
})
export class PlatformModule {}
