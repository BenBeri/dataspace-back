import { DataSourceType } from '../../platform/entities/enums/data-source-type.enum';

/**
 * Core interface for database connections across all database types
 * Provides a unified abstraction for different database systems
 */
export interface IDatabaseConnection {
  readonly connectionId: string;
  readonly workspaceId: string;
  readonly repositoryId: string;
  readonly dataSourceId: string;
  readonly type: DataSourceType;
  readonly createdAt: Date;
  
  // Core connection lifecycle
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isHealthy(): Promise<boolean>;
  
  // Query operations - unified interface for all database types
  execute<T = any>(query: string, params?: any[]): Promise<T>;
  executeTransaction<T = any>(
    operations: (connection: any) => Promise<T>
  ): Promise<T>;
  
  // Access to native database client for advanced operations
  getNativeClient(): any;
}
