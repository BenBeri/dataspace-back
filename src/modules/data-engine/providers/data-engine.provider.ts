import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { QueryExecutionService } from '../services/query-execution.service';
import { ConnectionPoolService } from '../services/connection-pool.service';
import { DataSourceService } from '../../platform/repository/services/data-source.service';
import { RepositoryService } from '../../platform/repository/services/repository.service';
import { WorkspaceService } from '../../platform/workspace/services/workspace.service';
import { KEY_MANAGEMENT_SERVICE } from '../../platform/key-management/key-management.module';
import type { IKeyManagementService } from '../../platform/key-management/interfaces/key-management.interface';
import { DataSourceType } from '../../platform/entities/enums/data-source-type.enum';
import { IDatabaseConnection } from '../interfaces/database-connection.interface';
import { IConnectionConfig } from '../interfaces/connection-config.interface';

/**
 * Data Engine Provider - Orchestration layer for data engine operations
 * Provides high-level interface for controllers and other modules
 * Follows project convention: Controllers → Providers → Services → Repository
 *
 * Provider orchestrates between services and handles all cross-service communication
 */
@Injectable()
export class DataEngineProvider {
  private readonly logger = new Logger(DataEngineProvider.name);

  constructor(
    private readonly queryExecutionService: QueryExecutionService,
    private readonly connectionPoolService: ConnectionPoolService,
    private readonly dataSourceService: DataSourceService,
    private readonly repositoryService: RepositoryService,
    private readonly workspaceService: WorkspaceService,
    @Inject(KEY_MANAGEMENT_SERVICE)
    private readonly keyManagementService: IKeyManagementService,
  ) {}

  /**
   * Extract database type from decrypted configuration (DEPRECATED)
   * Note: Database type should now come from repository.type instead of configuration
   * This method is kept for backwards compatibility but should not be used
   */
  private extractDatabaseType(config: Record<string, any>): DataSourceType {
    const type = config.type;
    if (!type) {
      throw new BadRequestException(
        'Database type not found in configuration. Database type should be specified at repository level.',
      );
    }

    // Validate that the type is a valid DataSourceType
    if (!Object.values(DataSourceType).includes(type)) {
      throw new BadRequestException(`Invalid database type: ${type}`);
    }

    return type as DataSourceType;
  }

  /**
   * Execute a query on a specific data source
   * Main entry point for database operations
   * Provider orchestrates between services following architecture conventions
   */
  async executeQuery(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
    query: string,
    params?: any[],
  ): Promise<{
    success: boolean;
    data: any;
    rowCount?: number;
    executionTime: number;
    type: DataSourceType;
  }> {
    const startTime = Date.now();

    try {
      // Provider orchestration: Get connection through proper service coordination
      const connection = await this.getConnection(
        workspaceId,
        repositoryId,
        dataSourceId,
      );

      // Execute query through service layer
      const result = await this.queryExecutionService.execute(
        connection,
        query,
        params,
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        rowCount: Array.isArray(result) ? result.length : undefined,
        executionTime,
        type: connection.type,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `Query execution failed for dataSource:${dataSourceId}: ${error.message}`,
      );

      throw new BadRequestException(`Query execution failed: ${error.message}`);
    }
  }

  /**
   * Execute multiple queries in batch
   */
  async executeBatchQueries(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
    queries: Array<{ query: string; params?: any[] }>,
  ): Promise<{
    success: boolean;
    results: any[];
    totalExecutionTime: number;
    type: DataSourceType;
  }> {
    const startTime = Date.now();

    try {
      // Provider orchestration: Get connection through proper service coordination
      const connection = await this.getConnection(
        workspaceId,
        repositoryId,
        dataSourceId,
      );

      // Execute batch queries through service layer
      const results = await this.queryExecutionService.executeBatch(
        connection,
        queries,
      );

      const totalExecutionTime = Date.now() - startTime;

      return {
        success: true,
        results,
        totalExecutionTime,
        type: connection.type,
      };
    } catch (error) {
      const totalExecutionTime = Date.now() - startTime;
      this.logger.error(
        `Batch query execution failed for dataSource:${dataSourceId}: ${error.message}`,
      );

      throw new BadRequestException(
        `Batch query execution failed: ${error.message}`,
      );
    }
  }

  /**
   * Execute transaction operations
   */
  async executeTransaction<T = any>(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
    operations: (client: any) => Promise<T>,
  ): Promise<{
    success: boolean;
    data: T;
    executionTime: number;
    type: DataSourceType;
  }> {
    const startTime = Date.now();

    try {
      // Provider orchestration: Get connection through proper service coordination
      const connection = await this.getConnection(
        workspaceId,
        repositoryId,
        dataSourceId,
      );

      // Execute transaction through service layer
      const result = await this.queryExecutionService.executeTransaction(
        connection,
        operations,
      );

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        executionTime,
        type: connection.type,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `Transaction failed for dataSource:${dataSourceId}: ${error.message}`,
      );

      throw new BadRequestException(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get connection status for a data source
   */
  async getConnectionStatus(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
  ): Promise<{
    workspaceId: string;
    repositoryId: string;
    dataSourceId: string;
    type: DataSourceType | null;
    status: 'healthy' | 'unhealthy' | 'disconnected';
    connectedAt?: Date;
    responseTime?: number;
    error?: string;
  }> {
    try {
      // Provider orchestration: Get connection through proper service coordination
      const connection = await this.getConnection(
        workspaceId,
        repositoryId,
        dataSourceId,
      );

      // Test connection health through service layer
      const healthCheck =
        await this.queryExecutionService.testConnection(connection);

      if (healthCheck.healthy) {
        return {
          workspaceId,
          repositoryId,
          dataSourceId,
          type: connection.type,
          status: 'healthy',
          connectedAt: connection.createdAt,
          responseTime: healthCheck.responseTime,
        };
      } else {
        return {
          workspaceId,
          repositoryId,
          dataSourceId,
          type: healthCheck.type,
          status: 'unhealthy',
          responseTime: healthCheck.responseTime,
          error: healthCheck.error,
        };
      }
    } catch (error) {
      return {
        workspaceId,
        repositoryId,
        dataSourceId,
        type: null,
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  /**
   * Get all data sources for a repository with their connection status
   */
  async getRepositoryDataSources(
    workspaceId: string,
    repositoryId: string,
  ): Promise<
    Array<{
      dataSourceId: string;
      name: string;
      type: DataSourceType;
      status: 'healthy' | 'unhealthy' | 'disconnected';
      connectedAt?: Date;
    }>
  > {
    try {
      // Validate repository access
      const repository =
        await this.repositoryService.getRepositoryById(repositoryId);

      if (repository.workspaceId !== workspaceId) {
        throw new ForbiddenException('Repository does not belong to workspace');
      }

      // Get data source for repository (currently only supports one per repository)
      // In the future, this could be extended to support multiple data sources
      const dataSource =
        await this.dataSourceService.getDataSourceByRepositoryId(repositoryId);
      const dataSources = dataSource ? [dataSource] : [];

      const result: Array<{
        dataSourceId: string;
        name: string;
        type: DataSourceType;
        status: 'healthy' | 'unhealthy' | 'disconnected';
        connectedAt?: Date;
      }> = [];

      for (const dataSource of dataSources) {
        try {
          // Use getConnection to follow proper orchestration pattern
          const connection = await this.getConnection(
            workspaceId,
            repositoryId,
            dataSource.id,
          );
          const healthCheck =
            await this.queryExecutionService.testConnection(connection);

          result.push({
            dataSourceId: dataSource.id,
            name: dataSource.name,
            type: connection.type,
            status: healthCheck.healthy ? 'healthy' : 'unhealthy',
            connectedAt: connection.createdAt,
          });
        } catch {
          // If connection failed, get database type from repository
          result.push({
            dataSourceId: dataSource.id,
            name: dataSource.name,
            type: repository.type,
            status: 'disconnected' as const,
          });
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get repository data sources for ${repositoryId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get native database client for advanced operations
   * Use with caution - bypasses connection pool management
   */
  async getNativeClient(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
  ): Promise<{
    client: any;
    type: DataSourceType;
    warning: string;
  }> {
    try {
      // Provider orchestration: Get connection through proper service coordination
      const connection = await this.getConnection(
        workspaceId,
        repositoryId,
        dataSourceId,
      );

      // Get native client through service layer
      const client = this.queryExecutionService.getNativeClient(connection);

      return {
        client,
        type: connection.type,
        warning:
          'Native client bypasses connection pool management. Use with caution.',
      };
    } catch (error) {
      this.logger.error(
        `Failed to get native client for dataSource:${dataSourceId}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to get native client: ${error.message}`,
      );
    }
  }

  /**
   * Disconnect a specific data source connection
   */
  async disconnectDataSource(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate access permissions
      await this.validateDataSourceAccess(
        workspaceId,
        repositoryId,
        dataSourceId,
      );

      // Remove connection from pool
      await this.connectionPoolService.removeConnection(
        workspaceId,
        repositoryId,
        dataSourceId,
      );

      return {
        success: true,
        message: `Data source ${dataSourceId} disconnected successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to disconnect dataSource:${dataSourceId}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to disconnect data source: ${error.message}`,
      );
    }
  }

  /**
   * Get overall connection pool statistics
   */
  async getPoolStatistics(): Promise<{
    totalConnections: number;
    activeConnections: number;
    connectionsByType: Record<DataSourceType, number>;
    connectionsByWorkspace: Record<string, number>;
  }> {
    try {
      const stats = await this.connectionPoolService.getConnectionStats();

      const connectionsByType: Record<DataSourceType, number> = {} as any;
      const connectionsByWorkspace: Record<string, number> = {};
      let activeConnections = 0;

      for (const stat of stats) {
        // Count by type
        connectionsByType[stat.type] = (connectionsByType[stat.type] || 0) + 1;

        // Count by workspace
        connectionsByWorkspace[stat.workspaceId] =
          (connectionsByWorkspace[stat.workspaceId] || 0) + 1;

        // Count active connections
        if (stat.healthy) {
          activeConnections++;
        }
      }

      return {
        totalConnections: stats.length,
        activeConnections,
        connectionsByType,
        connectionsByWorkspace,
      };
    } catch (error) {
      this.logger.error(`Failed to get pool statistics: ${error.message}`);
      throw new BadRequestException('Failed to get pool statistics');
    }
  }

  /**
   * Test database connection without saving to datasource or using connection pooling
   * Creates a temporary connection just for testing, then disconnects immediately
   * Provider orchestration: Direct call to service since no cross-service coordination needed
   */
  async testConnectionDirect(
    type: DataSourceType,
    config: IConnectionConfig,
    timeoutMs?: number,
  ): Promise<{
    success: boolean;
    type: DataSourceType;
    message: string;
    responseTime: number;
    error?: string;
    serverInfo?: {
      version?: string;
      serverName?: string;
      additionalInfo?: Record<string, any>;
    };
  }> {
    try {
      this.logger.debug(`Testing direct connection for database type: ${type}`);

      // Direct service call - no cross-service orchestration needed
      const result = await this.queryExecutionService.testConnectionDirect(
        type,
        config,
        timeoutMs,
      );

      this.logger.log(
        `Direct connection test completed for ${type}: ${result.success ? 'SUCCESS' : 'FAILED'} ` +
          `(${result.responseTime}ms)`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Direct connection test failed for type ${type}: ${error.message}`,
      );

      throw new BadRequestException(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Get database connection for a data source
   * Provider orchestration: Coordinates between services to get connection
   * This is where service-to-service coordination happens at the provider level
   */
  private async getConnection(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
  ): Promise<IDatabaseConnection> {
    try {
      // 1. Validate data source access - Provider orchestration
      await this.validateDataSourceAccess(
        workspaceId,
        repositoryId,
        dataSourceId,
      );

      // 2. Get repository information to get database type
      const repository =
        await this.repositoryService.getRepositoryById(repositoryId);

      if (!repository) {
        throw new NotFoundException(`Repository ${repositoryId} not found`);
      }

      // 3. Get data source information
      const dataSource =
        await this.dataSourceService.getDataSourceById(dataSourceId);

      if (!dataSource) {
        throw new NotFoundException(`Data source ${dataSourceId} not found`);
      }

      // 4. Get decrypted configuration using existing KMS integration
      const decryptedConfig =
        await this.dataSourceService.getDecryptedConfigurationById(
          dataSourceId,
        );

      if (!decryptedConfig) {
        throw new NotFoundException(
          `No configuration found for data source ${dataSourceId}`,
        );
      }

      // 5. Get database type from repository (not from data source configuration)
      const dbType = repository.type;

      // 6. Use connection pool service to get/create connection
      const connection = await this.connectionPoolService.getConnection(
        workspaceId,
        repositoryId,
        dataSourceId,
        dbType,
        decryptedConfig,
      );

      return connection;
    } catch (error) {
      this.logger.error(
        `Failed to get connection for dataSource:${dataSourceId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Validate user has access to the specified data source
   * Provider orchestration between services
   */
  private async validateDataSourceAccess(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
  ): Promise<void> {
    // Get data source and validate it exists
    const dataSource =
      await this.dataSourceService.getDataSourceById(dataSourceId);

    if (!dataSource) {
      throw new NotFoundException(`Data source ${dataSourceId} not found`);
    }

    // Validate data source belongs to repository
    if (dataSource.repositoryId !== repositoryId) {
      throw new ForbiddenException(
        `Data source ${dataSourceId} does not belong to repository ${repositoryId}`,
      );
    }

    // Validate repository belongs to workspace
    const repository =
      await this.repositoryService.getRepositoryById(repositoryId);

    if (repository.workspaceId !== workspaceId) {
      throw new ForbiddenException(
        `Repository ${repositoryId} does not belong to workspace ${workspaceId}`,
      );
    }
  }
}
