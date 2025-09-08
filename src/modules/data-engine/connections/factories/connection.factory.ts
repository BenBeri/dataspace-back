import { Injectable } from '@nestjs/common';
import { IDatabaseConnection } from '../../interfaces/database-connection.interface';
import { IConnectionConfig } from '../../interfaces/connection-config.interface';
import { DataSourceType } from '../../../platform/entities/enums/data-source-type.enum';
import { PostgresConnection } from '../sql/postgres.connection';

/**
 * Factory service for creating database connections
 * Uses factory pattern to instantiate appropriate database connection based on type
 */
@Injectable()
export class ConnectionFactory {
  /**
   * Creates a database connection instance based on the specified type
   */
  create(
    type: DataSourceType,
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
    config: IConnectionConfig,
  ): IDatabaseConnection {
    switch (type) {
      case DataSourceType.POSTGRES:
        return new PostgresConnection(workspaceId, repositoryId, dataSourceId, config);
      
      case DataSourceType.MYSQL:
        // TODO: Implement MySQL connection
        throw new Error('MySQL support coming soon');
      
      case DataSourceType.MONGODB:
        // TODO: Implement MongoDB connection
        throw new Error('MongoDB support coming soon');
      
      case DataSourceType.REDIS:
        // TODO: Implement Redis connection
        throw new Error('Redis support coming soon');
      
      case DataSourceType.MSSQL:
        // TODO: Implement MSSQL connection
        throw new Error('MSSQL support coming soon');
      
      case DataSourceType.SQLITE:
        // TODO: Implement SQLite connection
        throw new Error('SQLite support coming soon');
      
      case DataSourceType.ORACLE:
        // TODO: Implement Oracle connection
        throw new Error('Oracle support coming soon');
      
      case DataSourceType.ELASTICSEARCH:
        // TODO: Implement Elasticsearch connection
        throw new Error('Elasticsearch support coming soon');
      
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  /**
   * Get list of supported database types
   */
  getSupportedTypes(): DataSourceType[] {
    return [
      DataSourceType.POSTGRES, // Currently implemented
      // TODO: Add other types as they are implemented
    ];
  }

  /**
   * Check if a database type is supported
   */
  isSupported(type: DataSourceType): boolean {
    return this.getSupportedTypes().includes(type);
  }

  /**
   * Get configuration requirements for a specific database type
   */
  getConfigRequirements(type: DataSourceType): {
    required: string[];
    optional: string[];
  } {
    switch (type) {
      case DataSourceType.POSTGRES:
        return {
          required: ['host', 'username', 'password', 'database'],
          optional: ['port', 'ssl', 'schema', 'poolMin', 'poolMax', 'connectionTimeout'],
        };
      
      case DataSourceType.MYSQL:
        return {
          required: ['host', 'username', 'password', 'database'],
          optional: ['port', 'ssl', 'poolMin', 'poolMax', 'connectionTimeout'],
        };
      
      case DataSourceType.MONGODB:
        return {
          required: ['connectionString'],
          optional: ['database', 'authSource', 'poolMin', 'poolMax'],
        };
      
      case DataSourceType.REDIS:
        return {
          required: ['host'],
          optional: ['port', 'password', 'db', 'keyPrefix'],
        };
      
      default:
        return {
          required: [],
          optional: [],
        };
    }
  }

  /**
   * Validate configuration for a specific database type
   */
  validateConfig(type: DataSourceType, config: IConnectionConfig): void {
    const requirements = this.getConfigRequirements(type);
    const missing = requirements.required.filter(field => !config[field]);
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required configuration for ${type}: ${missing.join(', ')}`
      );
    }
  }
}
