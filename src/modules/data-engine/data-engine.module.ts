import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';

// Import all data engine components
import { ConnectionFactory } from './connections/factories/connection.factory';
import { ConnectionPoolService } from './services/connection-pool.service';
import { QueryExecutionService } from './services/query-execution.service';
import { DataEngineProvider } from './providers/data-engine.provider';
import {
  DataEngineController,
  DataEngineAdminController,
} from './data-engine.controller';

/**
 * Data Engine Module
 * Provides multi-database connection and query execution capabilities
 * Integrates with platform module for KMS-secured credential management
 */
@Module({
  imports: [
    // Import platform module to access DataSourceService, RepositoryService, etc.
    PlatformModule,
  ],
  controllers: [
    // REST API controllers
    DataEngineController,
    DataEngineAdminController,
  ],
  providers: [
    // Core factory for creating database connections
    ConnectionFactory,

    // Services following the architecture: Provider → Service → Repository
    ConnectionPoolService,
    QueryExecutionService,

    // Provider layer - main interface for controllers and other modules
    DataEngineProvider,
  ],
  exports: [
    // Export main provider for use by other modules
    DataEngineProvider,

    // Also export services for direct access if needed
    ConnectionPoolService,
    QueryExecutionService,
  ],
})
export class DataEngineModule {}
