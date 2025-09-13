import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from '../entities/repository/repository.entity';
import { DataSource } from '../entities/repository/data-source.entity';
import { DataSourceChangeHistory } from '../entities/repository/data-source-change-history.entity';
import { RepositoryController } from './repository.controller';
import { RepositoryProvider } from './providers/repository.provider';
import { RepositoryService } from './services/repository.service';
import { DataSourceService } from './services/data-source.service';
import { DataSourceChangeHistoryService } from './services/data-source-change-history.service';
import { RepositoryRepository } from './repositories/repository.repository';
import { DataSourceRepository } from './repositories/data-source.repository';
import { DataSourceChangeHistoryRepository } from './repositories/data-source-change-history.repository';
import { RepositoryFacade } from './facades/repository.facade';
import { RepositoryGuard } from './guards/repository.guard';
import { CaslRepositoryGuard } from './guards/casl-repository.guard';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AuthModule } from '../auth/auth.module';
import { KeyManagementModule } from '../key-management/key-management.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repository, DataSource, DataSourceChangeHistory]),
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
    DataSourceService,
    DataSourceChangeHistoryService,

    // Repositories
    RepositoryRepository,
    DataSourceRepository,
    DataSourceChangeHistoryRepository,

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
    DataSourceService,
    DataSourceRepository,
    RepositoryGuard,
    CaslRepositoryGuard,
  ],
})
export class RepositoryModule {}
