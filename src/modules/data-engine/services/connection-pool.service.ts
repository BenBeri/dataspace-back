import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { IDatabaseConnection } from '../interfaces/database-connection.interface';
import { ConnectionFactory } from '../connections/factories/connection.factory';
import { IConnectionConfig } from '../interfaces/connection-config.interface';
import { DataSourceType } from '../../platform/entities/enums/data-source-type.enum';

/**
 * Connection pool service for managing database connections
 * Following architecture: Service layer - only uses repositories, helpers, transformers
 * Does NOT communicate with other services - orchestration happens in Provider layer
 */
@Injectable()
export class ConnectionPoolService {
  private readonly pools = new Map<string, IDatabaseConnection>();
  private readonly logger = new Logger(ConnectionPoolService.name);

  constructor(
    private readonly connectionFactory: ConnectionFactory,
  ) {}

  /**
   * Get or create a database connection for the specified data source
   * Provider layer passes the required data (config, type) to avoid service-to-service communication
   */
  async getConnection(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
    dbType: DataSourceType,
    config: IConnectionConfig,
  ): Promise<IDatabaseConnection> {
    const poolKey = this.getPoolKey(workspaceId, repositoryId, dataSourceId);
    
    // Check if healthy connection exists in pool
    if (this.pools.has(poolKey)) {
      const connection = this.pools.get(poolKey)!;
      
      if (await connection.isHealthy()) {
        this.logger.debug(`Reusing existing connection for ${poolKey}`);
        return connection;
      } else {
        // Remove unhealthy connection from pool
        this.logger.warn(`Removing unhealthy connection for ${poolKey}`);
        await this.removeConnection(workspaceId, repositoryId, dataSourceId);
      }
    }
    
    // Create new connection with provided data
    return await this.createConnection(workspaceId, repositoryId, dataSourceId, dbType, config);
  }

  /**
   * Create a new database connection using provider-supplied configuration
   * Service layer - does NOT fetch data from other services
   */
  private async createConnection(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
    dbType: DataSourceType,
    config: IConnectionConfig,
  ): Promise<IDatabaseConnection> {
    try {
      this.logger.debug(
        `Creating new connection for workspace:${workspaceId}, ` +
        `repository:${repositoryId}, dataSource:${dataSourceId}`
      );

      // 1. Validate configuration for database type
      this.connectionFactory.validateConfig(dbType, config);
      
      // 2. Check if database type is supported
      if (!this.connectionFactory.isSupported(dbType)) {
        throw new BadRequestException(
          `Database type ${dbType} is not currently supported`
        );
      }
      
      // 3. Create appropriate database connection
      const connection = this.connectionFactory.create(
        dbType,
        workspaceId,
        repositoryId,
        dataSourceId,
        config,
      );
      
      // 4. Establish connection to database
      await connection.connect();
      
      // 5. Store in connection pool
      const poolKey = this.getPoolKey(workspaceId, repositoryId, dataSourceId);
      this.pools.set(poolKey, connection);
      
      this.logger.log(
        `Successfully created ${dbType} connection for dataSource:${dataSourceId}`
      );
      
      return connection;
      
    } catch (error) {
      this.logger.error(
        `Failed to create connection for dataSource:${dataSourceId}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Remove a specific connection from the pool
   */
  async removeConnection(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
  ): Promise<void> {
    const poolKey = this.getPoolKey(workspaceId, repositoryId, dataSourceId);
    const connection = this.pools.get(poolKey);
    
    if (connection) {
      try {
        await connection.disconnect();
        this.logger.log(`Disconnected connection for ${poolKey}`);
      } catch (error) {
        this.logger.error(`Error disconnecting ${poolKey}: ${error.message}`);
      } finally {
        this.pools.delete(poolKey);
      }
    }
  }

  /**
   * Remove all connections for a specific repository
   */
  async removeRepositoryConnections(
    workspaceId: string,
    repositoryId: string,
  ): Promise<void> {
    const prefix = `${workspaceId}:${repositoryId}:`;
    const connectionsToRemove = Array.from(this.pools.entries())
      .filter(([key]) => key.startsWith(prefix));
    
    this.logger.log(
      `Removing ${connectionsToRemove.length} connections for repository ${repositoryId}`
    );
    
    for (const [key, connection] of connectionsToRemove) {
      try {
        await connection.disconnect();
      } catch (error) {
        this.logger.error(`Error disconnecting ${key}: ${error.message}`);
      } finally {
        this.pools.delete(key);
      }
    }
  }

  /**
   * Remove all connections for a workspace
   */
  async removeWorkspaceConnections(workspaceId: string): Promise<void> {
    const prefix = `${workspaceId}:`;
    const connectionsToRemove = Array.from(this.pools.entries())
      .filter(([key]) => key.startsWith(prefix));
    
    this.logger.log(
      `Removing ${connectionsToRemove.length} connections for workspace ${workspaceId}`
    );
    
    for (const [key, connection] of connectionsToRemove) {
      try {
        await connection.disconnect();
      } catch (error) {
        this.logger.error(`Error disconnecting ${key}: ${error.message}`);
      } finally {
        this.pools.delete(key);
      }
    }
  }

  /**
   * Get connection statistics for monitoring and debugging
   */
  async getConnectionStats(): Promise<Array<{
    workspaceId: string;
    repositoryId: string;
    dataSourceId: string;
    type: DataSourceType;
    healthy: boolean;
    createdAt: Date;
    connectionId: string;
  }>> {
    const stats: Array<{
      workspaceId: string;
      repositoryId: string;
      dataSourceId: string;
      type: DataSourceType;
      healthy: boolean;
      createdAt: Date;
      connectionId: string;
    }> = [];
    
    for (const [key, connection] of this.pools.entries()) {
      const [workspaceId, repositoryId, dataSourceId] = key.split(':');
      
      try {
        const isHealthy = await connection.isHealthy();
        stats.push({
          workspaceId,
          repositoryId,
          dataSourceId,
          type: connection.type,
          healthy: isHealthy,
          createdAt: connection.createdAt,
          connectionId: connection.connectionId,
        });
      } catch (error) {
        stats.push({
          workspaceId,
          repositoryId,
          dataSourceId,
          type: connection.type,
          healthy: false,
          createdAt: connection.createdAt,
          connectionId: connection.connectionId,
        });
      }
    }
    
    return stats;
  }

  /**
   * Check if a connection exists in the pool
   */
  hasConnection(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
  ): boolean {
    const poolKey = this.getPoolKey(workspaceId, repositoryId, dataSourceId);
    return this.pools.has(poolKey);
  }

  /**
   * Get total number of active connections
   */
  getActiveConnectionCount(): number {
    return this.pools.size;
  }

  /**
   * Clean up all connections (useful for graceful shutdown)
   */
  async cleanup(): Promise<void> {
    this.logger.log(`Cleaning up ${this.pools.size} active connections`);
    
    const disconnectPromises = Array.from(this.pools.values()).map(connection =>
      connection.disconnect().catch(error =>
        this.logger.error(`Error during cleanup: ${error.message}`)
      )
    );
    
    await Promise.allSettled(disconnectPromises);
    this.pools.clear();
    
    this.logger.log('Connection pool cleanup completed');
  }

  /**
   * Generate unique pool key for connection identification
   */
  private getPoolKey(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
  ): string {
    return `${workspaceId}:${repositoryId}:${dataSourceId}`;
  }
}
