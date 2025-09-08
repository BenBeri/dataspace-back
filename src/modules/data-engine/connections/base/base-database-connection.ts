import { Logger } from '@nestjs/common';
import { IDatabaseConnection } from '../../interfaces/database-connection.interface';
import { IConnectionConfig } from '../../interfaces/connection-config.interface';
import { DataSourceType } from '../../../platform/entities/enums/data-source-type.enum';

/**
 * Abstract base class for all database connections
 * Provides common functionality and enforces contract implementation
 */
export abstract class BaseDatabaseConnection implements IDatabaseConnection {
  readonly connectionId: string;
  readonly createdAt: Date;
  protected logger: Logger;
  protected isConnected: boolean = false;
  protected config: IConnectionConfig;

  constructor(
    readonly workspaceId: string,
    readonly repositoryId: string,
    readonly dataSourceId: string,
    readonly type: DataSourceType,
    config: IConnectionConfig,
  ) {
    this.connectionId = `${workspaceId}:${repositoryId}:${dataSourceId}:${Date.now()}`;
    this.createdAt = new Date();
    this.config = config;
    this.logger = new Logger(`${this.constructor.name}-${dataSourceId}`);
  }

  // Abstract methods that must be implemented by concrete classes
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract execute<T = any>(query: string, params?: any[]): Promise<T>;
  abstract getNativeClient(): any;

  // Optional transaction support - not all databases support transactions
  async executeTransaction<T = any>(
    operations: (connection: any) => Promise<T>,
  ): Promise<T> {
    throw new Error(
      `Transactions not supported for ${this.type} database type`,
    );
  }

  // Common health check implementation
  async isHealthy(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      this.isConnected = false;
      return false;
    }
  }

  // Abstract health check method - each database type implements its own
  protected abstract healthCheck(): Promise<void>;

  // Common utility methods
  protected getConnectionTimeout(): number {
    return this.config.connectionTimeout || 60000; // 60 seconds default
  }

  protected getPoolConfig(): { min: number; max: number } {
    return {
      min: this.config.poolMin || 2,
      max: this.config.poolMax || 10,
    };
  }

  protected logConnection(): void {
    this.logger.log(
      `${this.type} connection established for workspace:${this.workspaceId}, ` +
        `repository:${this.repositoryId}, dataSource:${this.dataSourceId}`,
    );
  }

  protected logDisconnection(): void {
    this.logger.log(
      `${this.type} connection closed for dataSource:${this.dataSourceId}`,
    );
  }

  // Connection status info for monitoring
  getConnectionInfo(): {
    connectionId: string;
    workspaceId: string;
    repositoryId: string;
    dataSourceId: string;
    type: DataSourceType;
    connected: boolean;
    createdAt: Date;
  } {
    return {
      connectionId: this.connectionId,
      workspaceId: this.workspaceId,
      repositoryId: this.repositoryId,
      dataSourceId: this.dataSourceId,
      type: this.type,
      connected: this.isConnected,
      createdAt: this.createdAt,
    };
  }
}
