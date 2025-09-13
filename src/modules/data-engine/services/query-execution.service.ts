import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { IDatabaseConnection } from '../interfaces/database-connection.interface';
import { IConnectionConfig } from '../interfaces/connection-config.interface';
import { ConnectionFactory } from '../connections/factories/connection.factory';
import { DataSourceType } from '../../platform/entities/enums/data-source-type.enum';

/**
 * Query execution service providing high-level database operations
 * Following architecture: Service layer - only uses repositories, helpers, transformers
 * Does NOT communicate with other services - orchestration happens in Provider layer
 */
@Injectable()
export class QueryExecutionService {
  private readonly logger = new Logger(QueryExecutionService.name);

  constructor(private readonly connectionFactory: ConnectionFactory) {}

  /**
   * Execute a single query using the provided database connection
   * Provider layer passes the connection to avoid service-to-service communication
   */
  async execute<T = any>(
    connection: IDatabaseConnection,
    query: string,
    params?: any[],
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Execute query with timing
      const result = await connection.execute<T>(query, params);

      const executionTime = Date.now() - startTime;
      this.logQueryExecution(
        connection.dataSourceId,
        connection.type,
        executionTime,
        true,
      );

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logQueryExecution(
        connection.dataSourceId,
        null,
        executionTime,
        false,
        error.message,
      );

      throw new BadRequestException(
        `Query execution failed for dataSource ${connection.dataSourceId}: ${error.message}`,
      );
    }
  }

  /**
   * Execute multiple queries in batch for performance optimization
   */
  async executeBatch<T = any>(
    connection: IDatabaseConnection,
    queries: Array<{ query: string; params?: any[] }>,
  ): Promise<T[]> {
    const startTime = Date.now();

    try {
      // Execute all queries sequentially
      // TODO: For some databases, this could be optimized with true batch execution
      const results: T[] = [];
      for (const { query, params } of queries) {
        const result = await connection.execute<T>(query, params);
        results.push(result);
      }

      const executionTime = Date.now() - startTime;
      this.logger.debug(
        `Batch execution completed for dataSource:${connection.dataSourceId}, ` +
          `queries: ${queries.length}, time: ${executionTime}ms`,
      );

      return results;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `Batch execution failed for dataSource:${connection.dataSourceId}, ` +
          `time: ${executionTime}ms, error: ${error.message}`,
      );

      throw new BadRequestException(
        `Batch execution failed for dataSource ${connection.dataSourceId}: ${error.message}`,
      );
    }
  }

  /**
   * Execute operations within a database transaction
   * Only supported by databases that support transactions (SQL databases)
   */
  async executeTransaction<T = any>(
    connection: IDatabaseConnection,
    operations: (connection: any) => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // Check if database supports transactions
      if (!connection.executeTransaction) {
        throw new BadRequestException(
          `Database type ${connection.type} does not support transactions`,
        );
      }

      const result = await connection.executeTransaction(operations);

      const executionTime = Date.now() - startTime;
      this.logger.debug(
        `Transaction completed for dataSource:${connection.dataSourceId}, ` +
          `time: ${executionTime}ms`,
      );

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `Transaction failed for dataSource:${connection.dataSourceId}, ` +
          `time: ${executionTime}ms, error: ${error.message}`,
      );

      throw new BadRequestException(
        `Transaction failed for dataSource ${connection.dataSourceId}: ${error.message}`,
      );
    }
  }

  /**
   * Get native database client for advanced operations
   * Use with caution - bypasses connection pool management
   */
  getNativeClient(connection: IDatabaseConnection): any {
    this.logger.debug(
      `Providing native client for dataSource:${connection.dataSourceId}`,
    );
    return connection.getNativeClient();
  }

  /**
   * Test database connection health
   */
  async testConnection(connection: IDatabaseConnection): Promise<{
    healthy: boolean;
    responseTime: number;
    type: DataSourceType;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const isHealthy = await connection.isHealthy();
      const responseTime = Date.now() - startTime;

      return {
        healthy: isHealthy,
        responseTime,
        type: connection.type,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        healthy: false,
        responseTime,
        type: connection.type,
        error: error.message,
      };
    }
  }

  /**
   * Test database connection without using connection pooling
   * Creates a temporary connection just for testing, then disconnects immediately
   */
  async testConnectionDirect(
    type: DataSourceType,
    config: IConnectionConfig,
    timeoutMs: number = 10000,
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
    const startTime = Date.now();
    let connection: IDatabaseConnection | null = null;

    try {
      // 1. Validate configuration for database type
      this.connectionFactory.validateConfig(type, config);

      // 2. Check if database type is supported
      if (!this.connectionFactory.isSupported(type)) {
        return {
          success: false,
          type,
          message: `Database type ${type} is not currently supported`,
          responseTime: Date.now() - startTime,
          error: `Unsupported database type: ${type}`,
        };
      }

      // 3. Create temporary connection for testing (not stored in pool)
      connection = this.connectionFactory.create(
        type,
        'test-workspace', // Temporary workspace ID for testing
        'test-repository', // Temporary repository ID for testing
        'test-datasource', // Temporary datasource ID for testing
        config,
      );

      // 4. Apply timeout to connection establishment
      const connectionPromise = connection.connect();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Connection timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      await Promise.race([connectionPromise, timeoutPromise]);

      // 5. Test connection health
      const isHealthy = await connection.isHealthy();

      if (!isHealthy) {
        throw new Error('Connection established but health check failed');
      }

      // 6. Try to gather server information (database-specific)
      const serverInfo = await this.gatherServerInfo(connection, type);

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        type,
        message: 'Connection test successful',
        responseTime,
        serverInfo,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.logger.error(
        `Direct connection test failed for ${type}: ${error.message}`,
      );

      return {
        success: false,
        type,
        message: 'Connection test failed',
        responseTime,
        error: error.message,
      };
    } finally {
      // 7. Always disconnect the temporary connection
      if (connection) {
        try {
          await connection.disconnect();
          this.logger.debug(
            `Temporary test connection for ${type} disconnected`,
          );
        } catch (disconnectError) {
          this.logger.error(
            `Error disconnecting temporary test connection: ${disconnectError.message}`,
          );
        }
      }
    }
  }

  /**
   * Gather server information specific to the database type
   * This is best-effort - if it fails, we don't fail the whole connection test
   */
  private async gatherServerInfo(
    connection: IDatabaseConnection,
    type: DataSourceType,
  ): Promise<{
    version?: string;
    serverName?: string;
    additionalInfo?: Record<string, any>;
  }> {
    try {
      const serverInfo: {
        version?: string;
        serverName?: string;
        additionalInfo?: Record<string, any>;
      } = {};

      switch (type) {
        case DataSourceType.POSTGRES:
          try {
            const versionResult =
              await connection.execute<Array<{ version: string }>>(
                'SELECT version()',
              );
            serverInfo.version = versionResult[0]?.version;
            serverInfo.serverName = 'PostgreSQL';
          } catch (error) {
            this.logger.debug(
              `Could not get PostgreSQL version: ${error.message}`,
            );
          }
          break;

        case DataSourceType.MYSQL:
          try {
            const versionResult = await connection.execute<
              Array<{ version: string }>
            >('SELECT VERSION() as version');
            serverInfo.version = versionResult[0]?.version;
            serverInfo.serverName = 'MySQL';
          } catch (error) {
            this.logger.debug(`Could not get MySQL version: ${error.message}`);
          }
          break;

        case DataSourceType.MONGODB:
          serverInfo.serverName = 'MongoDB';
          // MongoDB version gathering would require different approach
          break;

        case DataSourceType.REDIS:
          serverInfo.serverName = 'Redis';
          // Redis version gathering would require different approach
          break;

        default:
          serverInfo.serverName = type;
          break;
      }

      return serverInfo;
    } catch (error) {
      this.logger.debug(
        `Could not gather server info for ${type}: ${error.message}`,
      );
      return { serverName: type };
    }
  }

  /**
   * Execute a query with timeout protection
   */
  async executeWithTimeout<T = any>(
    connection: IDatabaseConnection,
    query: string,
    params?: any[],
    timeoutMs: number = 30000, // 30 seconds default
  ): Promise<T> {
    return Promise.race([
      this.execute<T>(connection, query, params),
      this.createTimeoutPromise<T>(timeoutMs, connection.dataSourceId),
    ]);
  }

  /**
   * Log query execution details
   */
  private logQueryExecution(
    dataSourceId: string,
    dbType: DataSourceType | null,
    executionTime: number,
    success: boolean,
    errorMessage?: string,
  ): void {
    const logMessage =
      `Query execution - dataSource:${dataSourceId}, ` +
      `type:${dbType || 'unknown'}, time:${executionTime}ms, ` +
      `success:${success}`;

    if (success) {
      this.logger.debug(logMessage);
    } else {
      this.logger.error(`${logMessage}, error:${errorMessage}`);
    }
  }

  /**
   * Create a timeout promise for query execution
   */
  private createTimeoutPromise<T>(
    timeoutMs: number,
    dataSourceId: string,
  ): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new BadRequestException(
            `Query timeout after ${timeoutMs}ms for dataSource ${dataSourceId}`,
          ),
        );
      }, timeoutMs);
    });
  }
}
