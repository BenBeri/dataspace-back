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
import { RepositoryService } from '../../platform/repository/services/repository.service';
import { RepositoryFacade } from '../../platform/repository/facades/repository.facade';
import { WorkspaceService } from '../../platform/workspace/services/workspace.service';
import { WorkspaceMemberService } from '../../platform/workspace/services/workspace-member.service';
import { CredentialsResolverService } from '../../platform/repository/services/credentials-resolver.service';
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
    private readonly repositoryService: RepositoryService,
    private readonly repositoryFacade: RepositoryFacade,
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceMemberService: WorkspaceMemberService,
    private readonly credentialsResolverService: CredentialsResolverService,
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
   * Execute a query on a repository's database connection
   * Main entry point for database operations
   * Provider orchestrates between services following architecture conventions
   */
  async executeQuery(
    workspaceId: string,
    repositoryId: string,
    userId: string,
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
      // Provider orchestration: Get user-specific connection through proper service coordination
      const connection = await this.getConnection(
        workspaceId,
        repositoryId,
        userId,
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
        `Query execution failed for repository:${repositoryId} and user:${userId}: ${error.message}`,
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
    userId: string,
    queries: Array<{ query: string; params?: any[] }>,
  ): Promise<{
    success: boolean;
    results: any[];
    totalExecutionTime: number;
    type: DataSourceType;
  }> {
    const startTime = Date.now();

    try {
      // Provider orchestration: Get user-specific connection through proper service coordination
      const connection = await this.getConnection(
        workspaceId,
        repositoryId,
        userId,
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
        `Batch query execution failed for repository:${repositoryId} and user:${userId}: ${error.message}`,
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
    userId: string,
    operations: (client: any) => Promise<T>,
  ): Promise<{
    success: boolean;
    data: T;
    executionTime: number;
    type: DataSourceType;
  }> {
    const startTime = Date.now();

    try {
      // Provider orchestration: Get user-specific connection through proper service coordination
      const connection = await this.getConnection(
        workspaceId,
        repositoryId,
        userId,
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
        `Transaction failed for repository:${repositoryId} and user:${userId}: ${error.message}`,
      );

      throw new BadRequestException(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get connection status for a repository
   */
  async getConnectionStatus(
    workspaceId: string,
    repositoryId: string,
    userId: string,
  ): Promise<{
    workspaceId: string;
    repositoryId: string;
    type: DataSourceType | null;
    status: 'healthy' | 'unhealthy' | 'disconnected';
    connectedAt?: Date;
    responseTime?: number;
    error?: string;
  }> {
    try {
      // Provider orchestration: Get user-specific connection through proper service coordination
      const connection = await this.getConnection(
        workspaceId,
        repositoryId,
        userId,
      );

      // Test connection health through service layer
      const healthCheck =
        await this.queryExecutionService.testConnection(connection);

      if (healthCheck.healthy) {
        return {
          workspaceId,
          repositoryId,
          type: connection.type,
          status: 'healthy',
          connectedAt: connection.createdAt,
          responseTime: healthCheck.responseTime,
        };
      } else {
        return {
          workspaceId,
          repositoryId,
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
        type: null,
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  /**
   * Get repository connection information
   */
  async getRepositoryConnectionInfo(
    workspaceId: string,
    repositoryId: string,
    userId: string,
  ): Promise<{
    repositoryId: string;
    credentialsName: string | null;
    type: DataSourceType;
    status: 'healthy' | 'unhealthy' | 'disconnected' | 'no-connection';
    connectedAt?: Date;
  }> {
    try {
      // Validate repository access
      const repository =
        await this.repositoryService.getRepositoryById(repositoryId);

      if (repository.workspaceId !== workspaceId) {
        throw new ForbiddenException('Repository does not belong to workspace');
      }

      // Check if user can access any credentials for this repository
      const canAccess =
        await this.credentialsResolverService.canUserAccessRepository(
          repositoryId,
          userId,
          await this.getUserGroupsInWorkspace(workspaceId, userId),
        );

      if (!canAccess) {
        return {
          repositoryId,
          credentialsName: null,
          type: repository.type,
          status: 'no-connection',
        };
      }

      try {
        // Test connection health with user-specific credentials
        const connection = await this.getConnection(
          workspaceId,
          repositoryId,
          userId,
        );
        const healthCheck =
          await this.queryExecutionService.testConnection(connection);

        return {
          repositoryId,
          credentialsName: credentials.name,
          type: connection.type,
          status: healthCheck.healthy ? 'healthy' : 'unhealthy',
          connectedAt: connection.createdAt,
        };
      } catch {
        return {
          repositoryId,
          credentialsName: credentials?.name || null,
          type: repository.type,
          status: 'disconnected',
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to get repository connection info for ${repositoryId}: ${error.message}`,
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
    userId: string,
  ): Promise<{
    client: any;
    type: DataSourceType;
    warning: string;
  }> {
    try {
      // Provider orchestration: Get user-specific connection through proper service coordination
      const connection = await this.getConnection(
        workspaceId,
        repositoryId,
        userId,
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
        `Failed to get native client for repository:${repositoryId} and user:${userId}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to get native client: ${error.message}`,
      );
    }
  }

  /**
   * Disconnect a repository connection
   */
  async disconnectRepository(
    workspaceId: string,
    repositoryId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate access permissions
      await this.validateRepositoryAccess(workspaceId, repositoryId);

      // Remove connection from pool
      await this.connectionPoolService.removeConnection(
        workspaceId,
        repositoryId,
        repositoryId, // Using repositoryId as the connection identifier
      );

      return {
        success: true,
        message: `Repository ${repositoryId} disconnected successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to disconnect repository:${repositoryId}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to disconnect repository: ${error.message}`,
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
   * Test database connection using an existing Repository's connection configuration
   * Retrieves and decrypts credentials from the Repository, then tests the connection
   * Provider orchestration: Coordinates between services to get decrypted config and test connection
   */
  async testConnectionFromRepository(
    workspaceId: string,
    repositoryId: string,
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
      this.logger.debug(`Testing connection for repository:${repositoryId}`);

      // Provider orchestration: Validate access and get data
      await this.validateRepositoryAccess(workspaceId, repositoryId);

      // Get repository to determine database type
      const repository =
        await this.repositoryService.getRepositoryById(repositoryId);
      if (!repository) {
        throw new NotFoundException(`Repository ${repositoryId} not found`);
      }

      // Get repository connection configuration
      const decryptedConfig =
        await this.repositoryFacade.getConnectionConfiguration(repositoryId);
      if (!decryptedConfig) {
        throw new NotFoundException(
          `No connection configuration found for repository ${repositoryId}`,
        );
      }

      // Test connection using decrypted configuration
      const result = await this.queryExecutionService.testConnectionDirect(
        repository.type,
        decryptedConfig,
        timeoutMs,
      );

      this.logger.log(
        `Repository connection test completed for ${repositoryId}: ${result.success ? 'SUCCESS' : 'FAILED'} ` +
          `(${result.responseTime}ms)`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Repository connection test failed for ${repositoryId}: ${error.message}`,
      );

      throw new BadRequestException(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Test database connection using encrypted credentials from request body
   * Decrypts the provided encrypted configuration using workspace KMS key, then tests the connection
   * Provider orchestration: Coordinates between workspace service, KMS service, and query execution service
   */
  async testConnectionWithEncryptedConfig(
    workspaceId: string,
    type: DataSourceType,
    encryptedConfig: string,
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
      this.logger.debug(
        `Testing connection with encrypted config for workspace:${workspaceId}`,
      );

      // Provider orchestration: Get workspace to validate access
      const workspace =
        await this.workspaceService.getWorkspaceById(workspaceId);
      if (!workspace) {
        throw new NotFoundException(`Workspace ${workspaceId} not found`);
      }

      if (!workspace.kmsKeyId) {
        throw new BadRequestException('Workspace encryption key not found');
      }

      // Decrypt the configuration
      const decryptedConfigJson =
        await this.keyManagementService.decrypt(encryptedConfig);
      const decryptedConfig = JSON.parse(decryptedConfigJson);

      // Test connection using decrypted configuration
      const result = await this.queryExecutionService.testConnectionDirect(
        type,
        decryptedConfig,
        timeoutMs,
      );

      this.logger.log(
        `Encrypted config connection test completed for workspace ${workspaceId}: ${result.success ? 'SUCCESS' : 'FAILED'} ` +
          `(${result.responseTime}ms)`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Encrypted config connection test failed for workspace ${workspaceId}: ${error.message}`,
      );

      throw new BadRequestException(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Get database connection for a repository with user-specific credentials
   * Provider orchestration: Coordinates between services to get connection
   * This is where service-to-service coordination happens at the provider level
   */
  private async getConnection(
    workspaceId: string,
    repositoryId: string,
    userId: string,
  ): Promise<IDatabaseConnection> {
    try {
      // 1. Validate repository access - Provider orchestration
      await this.validateRepositoryAccess(workspaceId, repositoryId);

      // 2. Get repository information to get database type
      const repository =
        await this.repositoryService.getRepositoryById(repositoryId);

      if (!repository) {
        throw new NotFoundException(`Repository ${repositoryId} not found`);
      }

      // 3. Get user's groups in the workspace for credentials resolution
      const userGroupIds = await this.getUserGroupsInWorkspace(
        workspaceId,
        userId,
      );

      // 4. Resolve user-specific credentials using the new credentials system
      const credentialsResult =
        await this.credentialsResolverService.resolveCredentialsForUser(
          repositoryId,
          userId,
          userGroupIds,
        );

      // 5. Decrypt the resolved credentials
      const decryptedConfig = await this.keyManagementService.decrypt(
        credentialsResult.credentials.encryptedCredentials,
      );
      const parsedConfig = JSON.parse(decryptedConfig);

      this.logger.debug(
        `Using ${credentialsResult.accessType} credentials "${credentialsResult.credentials.name}" for user ${userId} on repository ${repositoryId}`,
      );

      // 6. Get database type from repository
      const dbType = repository.type;

      // 7. Create unique connection identifier for user-specific credentials
      // Format: repositoryId:credentialsId:userId (for user-specific caching)
      const connectionIdentifier = `${repositoryId}:${credentialsResult.credentials.id}:${userId}`;

      // 8. Use connection pool service to get/create connection with user-specific credentials
      const connection = await this.connectionPoolService.getConnection(
        workspaceId,
        repositoryId,
        connectionIdentifier,
        dbType,
        parsedConfig,
      );

      return connection;
    } catch (error) {
      this.logger.error(
        `Failed to get connection for repository ${repositoryId} and user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get user's group IDs in a workspace for credentials resolution
   */
  private async getUserGroupsInWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<string[]> {
    try {
      // Get workspace membership to find user's groups
      const workspaceMember =
        await this.workspaceMemberService.getMemberByWorkspaceAndUser(
          workspaceId,
          userId,
        );

      // Return the user's group ID (in the current system, each user has one group/role)
      return workspaceMember.groupId ? [workspaceMember.groupId] : [];
    } catch (error) {
      this.logger.warn(
        `Failed to get user groups for user ${userId} in workspace ${workspaceId}: ${error.message}`,
      );
      return []; // Return empty array if unable to determine groups
    }
  }

  /**
   * Validate user has access to the specified repository
   * Provider orchestration between services
   */
  private async validateRepositoryAccess(
    workspaceId: string,
    repositoryId: string,
  ): Promise<void> {
    // Get repository and validate it exists
    const repository =
      await this.repositoryService.getRepositoryById(repositoryId);

    if (!repository) {
      throw new NotFoundException(`Repository ${repositoryId} not found`);
    }

    // Validate repository belongs to workspace
    if (repository.workspaceId !== workspaceId) {
      throw new ForbiddenException(
        `Repository ${repositoryId} does not belong to workspace ${workspaceId}`,
      );
    }
  }
}
