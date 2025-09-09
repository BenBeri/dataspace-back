import { DataSource, EntityManager } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BaseDatabaseConnection } from '../base/base-database-connection';
import { IConnectionConfig } from '../../interfaces/connection-config.interface';
import { DataSourceType } from '../../../platform/entities/enums/data-source-type.enum';

/**
 * PostgreSQL database connection implementation using TypeORM
 * Supports connection pooling, transactions, and advanced PostgreSQL features
 */
export class PostgresConnection extends BaseDatabaseConnection {
  private dataSource: DataSource;

  constructor(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
    config: IConnectionConfig,
  ) {
    super(
      workspaceId,
      repositoryId,
      dataSourceId,
      DataSourceType.POSTGRES,
      config,
    );
  }

  async connect(): Promise<void> {
    try {
      // Validate required configuration
      this.validateConfig();

      // Create TypeORM DataSource with connection pooling
      this.dataSource = new DataSource({
        type: 'postgres',
        host: this.config.host,
        port: this.config.port || 5432,
        username: this.config.username,
        password: this.config.password,
        database: this.config.database,
        schema: this.config.schema,
        ssl: this.getSslConfig(),

        // Connection pooling configuration
        extra: {
          min: this.getPoolConfig().min,
          max: this.getPoolConfig().max,
          connectionTimeoutMillis: this.getConnectionTimeout(),
          idleTimeoutMillis: 600000, // 10 minutes
          acquireTimeoutMillis: 60000, // 1 minute
        },

        // Performance and reliability settings
        connectTimeoutMS: this.getConnectionTimeout(),
        logging: (process?.env?.NODE_ENV || 'production') === 'development',
        synchronize: false, // Never sync in production
        dropSchema: false,

        // Additional config from extra field
        ...this.config.extra,
      });

      // Initialize the connection
      await this.dataSource.initialize();
      this.isConnected = true;
      this.logConnection();
    } catch (error) {
      this.logger.error(`Failed to connect to PostgreSQL: ${error.message}`);
      throw new BadRequestException(
        `PostgreSQL connection failed: ${error.message}`,
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      try {
        await this.dataSource.destroy();
        this.isConnected = false;
        this.logDisconnection();
      } catch (error) {
        this.logger.error(
          `Error disconnecting from PostgreSQL: ${error.message}`,
        );
      }
    }
  }

  async execute<T = any>(query: string, params?: any[]): Promise<T> {
    if (!this.isConnected) {
      throw new BadRequestException('PostgreSQL connection not established');
    }

    try {
      // Convert MySQL-style ? parameters to PostgreSQL-style $1, $2, $3 parameters
      const convertedQuery = this.convertParametersToPostgresFormat(query);

      const result = await this.dataSource.query(convertedQuery, params);

      this.logger.debug(
        `Executed query on dataSource:${this.dataSourceId}, ` +
          `rows affected: ${Array.isArray(result) ? result.length : 'N/A'}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Query execution failed on dataSource:${this.dataSourceId}: ${error.message}`,
      );
      throw new BadRequestException(
        `PostgreSQL query failed: ${error.message}`,
      );
    }
  }

  async executeTransaction<T = any>(
    operations: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    if (!this.isConnected) {
      throw new BadRequestException('PostgreSQL connection not established');
    }

    try {
      return await this.dataSource.transaction(operations);
    } catch (error) {
      this.logger.error(
        `Transaction failed on dataSource:${this.dataSourceId}: ${error.message}`,
      );
      throw new BadRequestException(
        `PostgreSQL transaction failed: ${error.message}`,
      );
    }
  }

  getNativeClient(): DataSource {
    return this.dataSource;
  }

  protected async healthCheck(): Promise<void> {
    if (!this.dataSource?.isInitialized) {
      throw new Error('DataSource not initialized');
    }

    // Simple health check query
    await this.dataSource.query('SELECT 1 as health_check');
  }

  // PostgreSQL-specific methods

  /**
   * Get PostgreSQL server version
   */
  async getServerVersion(): Promise<string> {
    const result =
      await this.execute<Array<{ version: string }>>('SELECT version()');
    return result[0]?.version || 'Unknown';
  }

  /**
   * Get current database size
   */
  async getDatabaseSize(): Promise<string> {
    const result = await this.execute<Array<{ size: string }>>(
      'SELECT pg_size_pretty(pg_database_size(current_database())) as size',
    );
    return result[0]?.size || '0 bytes';
  }

  /**
   * Get active connection count
   */
  async getActiveConnections(): Promise<number> {
    const result = await this.execute<Array<{ count: number }>>(
      "SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'",
    );
    return result[0]?.count || 0;
  }

  /**
   * Get table list in current database
   */
  async getTableList(): Promise<string[]> {
    const result = await this.execute<Array<{ table_name: string }>>(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       ORDER BY table_name`,
    );
    return result.map((row) => row.table_name);
  }

  private validateConfig(): void {
    const required = ['host', 'username', 'password', 'database'];
    const missing = required.filter((field) => !this.config[field]);

    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required PostgreSQL configuration: ${missing.join(', ')}`,
      );
    }
  }

  /**
   * Convert MySQL-style ? parameters to PostgreSQL-style $1, $2, $3 parameters
   */
  private convertParametersToPostgresFormat(query: string): string {
    let parameterIndex = 1;
    return query.replace(/\?/g, () => `$${parameterIndex++}`);
  }

  /**
   * Get SSL configuration based on the data source config
   * Handles self-signed certificates for development environments
   */
  private getSslConfig(): boolean | object {
    if (!this.config.ssl) {
      return false;
    }

    // If SSL is true but no specific SSL configuration is provided,
    // use development-friendly settings that accept self-signed certificates
    if (this.config.ssl === true) {
      return {
        rejectUnauthorized: false, // Accept self-signed certificates
        ca: undefined, // Don't require CA certificate
        cert: undefined,
        key: undefined,
        checkServerIdentity: () => undefined, // Skip server identity check
      };
    }

    // If SSL is an object, use it directly (for custom SSL configurations)
    if (typeof this.config.ssl === 'object') {
      return this.config.ssl;
    }

    return false;
  }
}
