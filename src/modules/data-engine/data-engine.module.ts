import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';

// Import all data engine components
import { ConnectionFactory } from './connections/factories/connection.factory';
import { ConnectionPoolService } from './services/connection-pool.service';
import { QueryExecutionService } from './services/query-execution.service';
import { SchemaDiscoveryService } from './services/schema-discovery.service';
import { DataEngineProvider } from './providers/data-engine.provider';
import { PlaygroundProvider } from './providers/playground.provider';
import {
  ConnectionTestController,
  DataEngineController,
  DataEngineAdminController,
} from './data-engine.controller';
import { PlaygroundController } from './playground.controller';

/**
 * Data Engine Module
 * Provides multi-database connection and query execution capabilities
 * Integrates with platform module for KMS-secured credential management
 */
@Module({
  imports: [
    // Import platform module to access RepositoryService, RepositoryFacade, etc.
    PlatformModule,
  ],
  controllers: [
    // REST API controllers
    ConnectionTestController, // Standalone connection testing
    DataEngineController,
    DataEngineAdminController,
    PlaygroundController, // Playground repository management
  ],
  providers: [
    // Core factory for creating database connections
    ConnectionFactory,

    // Services following the architecture: Provider → Service → Repository
    ConnectionPoolService,
    QueryExecutionService,
    SchemaDiscoveryService,

    // Provider layer - main interface for controllers and other modules
    DataEngineProvider,
    PlaygroundProvider,
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
