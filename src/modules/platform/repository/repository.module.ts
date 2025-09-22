import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from '../entities/repository/repository.entity';
import { RepositoryConnectionHistory } from '../entities/repository/repository-connection-history.entity';
import { RepositoryCredentials } from '../entities/repository/repository-credentials.entity';
import { CredentialsAccess } from '../entities/repository/credentials-access.entity';
import { RepositoryController } from './repository.controller';
import { RepositoryProvider } from './providers/repository.provider';
import { RepositoryService } from './services/repository.service';
import { RepositoryConnectionHistoryService } from './services/repository-connection-history.service';
import { RepositoryCredentialsService } from './services/repository-credentials.service';
import { CredentialsAccessService } from './services/credentials-access.service';
import { CredentialsResolverService } from './services/credentials-resolver.service';
import { RepositoryRepository } from './repositories/repository.repository';
import { RepositoryConnectionHistoryRepository } from './repositories/repository-connection-history.repository';
import { RepositoryCredentialsRepository } from './repositories/repository-credentials.repository';
import { CredentialsAccessRepository } from './repositories/credentials-access.repository';
import { RepositoryFacade } from './facades/repository.facade';
import { RepositoryGuard } from './guards/repository.guard';
import { CaslRepositoryGuard } from './guards/casl-repository.guard';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AuthModule } from '../auth/auth.module';
import { KeyManagementModule } from '../key-management/key-management.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Repository,
      RepositoryConnectionHistory,
      RepositoryCredentials,
      CredentialsAccess,
    ]),
    forwardRef(() => WorkspaceModule),
    forwardRef(() => AuthModule),
    KeyManagementModule,
  ],
  controllers: [RepositoryController],
  providers: [
    // Providers
    RepositoryProvider,

    // Services
    RepositoryService,
    RepositoryConnectionHistoryService,
    RepositoryCredentialsService,
    CredentialsAccessService,
    CredentialsResolverService,

    // Repositories
    RepositoryRepository,
    RepositoryConnectionHistoryRepository,
    RepositoryCredentialsRepository,
    CredentialsAccessRepository,

    // Facades
    RepositoryFacade,

    // Guards
    RepositoryGuard,
    CaslRepositoryGuard,
  ],
  exports: [
    RepositoryService,
    RepositoryRepository,
    RepositoryFacade,
    RepositoryConnectionHistoryService,
    RepositoryConnectionHistoryRepository,
    CredentialsResolverService,
    RepositoryGuard,
    CaslRepositoryGuard,
  ],
})
export class RepositoryModule {}
