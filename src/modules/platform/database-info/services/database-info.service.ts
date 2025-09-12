import { Injectable, Logger } from '@nestjs/common';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';
import {
  DatabaseInfoDto,
  DatabaseConfigFieldDto,
} from '../dto/supported-databases-response.dto';

/**
 * Service for retrieving information about supported databases
 * Handles business logic for database configuration and metadata
 */
@Injectable()
export class DatabaseInfoService {
  private readonly logger = new Logger(DatabaseInfoService.name);

  /**
   * Get all supported databases with basic information
   * Only returns implemented databases
   */
  getSupportedDatabases(includeConfig: boolean = false): DatabaseInfoDto[] {
    const databases: DatabaseInfoDto[] = [];

    // Iterate through all database types
    Object.values(DataSourceType).forEach((type) => {
      // Only include implemented databases
      if (this.isImplemented(type)) {
        const dbInfo = this.getDatabaseInfo(type, includeConfig);
        databases.push(dbInfo);
      }
    });

    return databases.sort((a, b) => {
      // Sort alphabetically since all returned databases are implemented
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get information for a specific database type
   */
  private getDatabaseInfo(
    type: DataSourceType,
    includeConfig: boolean,
  ): DatabaseInfoDto {
    const baseInfo = this.getBaseDatabaseInfo(type);
    const configFields = includeConfig ? this.getConfigFields(type) : undefined;

    return {
      ...baseInfo,
      configFields,
    };
  }

  /**
   * Get basic information about a database type
   */
  private getBaseDatabaseInfo(
    type: DataSourceType,
  ): Omit<DatabaseInfoDto, 'configFields'> {
    const databaseMeta = this.getDatabaseMetadata();
    const meta = databaseMeta[type];

    return {
      type,
      name: meta?.name || this.formatTypeName(type),
      implemented: this.isImplemented(type),
      description: meta?.description,
      defaultPort: meta?.defaultPort,
    };
  }

  /**
   * Get configuration fields for a database type
   */
  private getConfigFields(type: DataSourceType): DatabaseConfigFieldDto[] {
    const requirements = this.getConfigRequirements(type);
    const fields: DatabaseConfigFieldDto[] = [];

    // Add required fields
    requirements.required.forEach((fieldName) => {
      const fieldInfo = this.getFieldInfo(type, fieldName, true);
      fields.push(fieldInfo);
    });

    // Add optional fields
    requirements.optional.forEach((fieldName) => {
      const fieldInfo = this.getFieldInfo(type, fieldName, false);
      fields.push(fieldInfo);
    });

    return fields.sort((a, b) => {
      // Sort required fields first, then alphabetically
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Get configuration requirements for a specific database type
   * This mirrors the logic from ConnectionFactory
   */
  private getConfigRequirements(type: DataSourceType): {
    required: string[];
    optional: string[];
  } {
    switch (type) {
      case DataSourceType.POSTGRES:
        return {
          required: ['host', 'username', 'password', 'database'],
          optional: [
            'port',
            'ssl',
            'schema',
            'poolMin',
            'poolMax',
            'connectionTimeout',
          ],
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

      case DataSourceType.MSSQL:
      case DataSourceType.SQLSERVER:
        return {
          required: ['host', 'username', 'password', 'database'],
          optional: [
            'port',
            'ssl',
            'poolMin',
            'poolMax',
            'connectionTimeout',
            'schema',
          ],
        };

      case DataSourceType.SQLITE:
        return {
          required: ['filename'],
          optional: ['poolMin', 'poolMax'],
        };

      case DataSourceType.ORACLE:
        return {
          required: ['host', 'username', 'password', 'database'],
          optional: [
            'port',
            'ssl',
            'poolMin',
            'poolMax',
            'connectionTimeout',
            'schema',
          ],
        };

      case DataSourceType.ELASTICSEARCH:
        return {
          required: ['node'],
          optional: ['nodes', 'apiKey', 'username', 'password'],
        };

      case DataSourceType.CASSANDRA:
        return {
          required: ['host'],
          optional: ['port', 'username', 'password', 'keyspace'],
        };

      case DataSourceType.DYNAMODB:
        return {
          required: ['region'],
          optional: ['accessKeyId', 'secretAccessKey', 'endpoint'],
        };

      default:
        return {
          required: [],
          optional: [],
        };
    }
  }

  /**
   * Get field information with defaults and descriptions
   */
  private getFieldInfo(
    type: DataSourceType,
    fieldName: string,
    required: boolean,
  ): DatabaseConfigFieldDto {
    const fieldDefaults = this.getFieldDefaults();
    const fieldInfo = fieldDefaults[fieldName];
    const typeSpecificDefaults = this.getTypeSpecificDefaults(type);

    return {
      name: fieldName,
      type: fieldInfo?.type || 'string',
      required,
      defaultValue: typeSpecificDefaults[fieldName] || fieldInfo?.defaultValue,
      description: fieldInfo?.description,
    };
  }

  /**
   * Check if a database type is currently implemented
   */
  private isImplemented(type: DataSourceType): boolean {
    // Currently only PostgreSQL is implemented
    return type === DataSourceType.POSTGRES;
  }

  /**
   * Format database type name for display
   */
  private formatTypeName(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }

  /**
   * Database metadata with descriptions and default ports
   */
  private getDatabaseMetadata(): Record<
    DataSourceType,
    {
      name: string;
      description: string;
      defaultPort?: number;
    }
  > {
    return {
      [DataSourceType.POSTGRES]: {
        name: 'PostgreSQL',
        description: 'Open-source relational database with advanced features',
        defaultPort: 5432,
      },
      [DataSourceType.MYSQL]: {
        name: 'MySQL',
        description: 'Popular open-source relational database',
        defaultPort: 3306,
      },
      [DataSourceType.MONGODB]: {
        name: 'MongoDB',
        description: 'Document-oriented NoSQL database',
        defaultPort: 27017,
      },
      [DataSourceType.REDIS]: {
        name: 'Redis',
        description: 'In-memory data structure store and cache',
        defaultPort: 6379,
      },
      [DataSourceType.MSSQL]: {
        name: 'Microsoft SQL Server',
        description: 'Enterprise relational database by Microsoft',
        defaultPort: 1433,
      },
      [DataSourceType.SQLITE]: {
        name: 'SQLite',
        description: 'Lightweight file-based SQL database',
      },
      [DataSourceType.ORACLE]: {
        name: 'Oracle Database',
        description: 'Enterprise relational database by Oracle',
        defaultPort: 1521,
      },
      [DataSourceType.ELASTICSEARCH]: {
        name: 'Elasticsearch',
        description: 'Distributed search and analytics engine',
        defaultPort: 9200,
      },
      [DataSourceType.CASSANDRA]: {
        name: 'Apache Cassandra',
        description: 'Distributed wide-column NoSQL database',
        defaultPort: 9042,
      },
      [DataSourceType.DYNAMODB]: {
        name: 'Amazon DynamoDB',
        description: 'Fully managed NoSQL database service by AWS',
      },
      [DataSourceType.SQLSERVER]: {
        name: 'SQL Server',
        description: 'Microsoft SQL Server database',
        defaultPort: 1433,
      },
    };
  }

  /**
   * Field definitions with types, defaults, and descriptions
   */
  private getFieldDefaults(): Record<
    string,
    {
      type: string;
      defaultValue?: any;
      description: string;
    }
  > {
    return {
      host: {
        type: 'string',
        defaultValue: 'localhost',
        description: 'Database server hostname or IP address',
      },
      port: {
        type: 'number',
        description: 'Database server port number',
      },
      username: {
        type: 'string',
        description: 'Database username for authentication',
      },
      password: {
        type: 'string',
        description: 'Database password for authentication',
      },
      database: {
        type: 'string',
        description: 'Name of the database to connect to',
      },
      schema: {
        type: 'string',
        description: 'Database schema name (if supported)',
      },
      ssl: {
        type: 'boolean',
        defaultValue: false,
        description: 'Enable SSL/TLS connection encryption',
      },
      poolMin: {
        type: 'number',
        defaultValue: 1,
        description: 'Minimum number of connections in the pool',
      },
      poolMax: {
        type: 'number',
        defaultValue: 10,
        description: 'Maximum number of connections in the pool',
      },
      connectionTimeout: {
        type: 'number',
        defaultValue: 30000,
        description: 'Connection timeout in milliseconds',
      },
      connectionString: {
        type: 'string',
        description: 'Full connection string (MongoDB, etc.)',
      },
      authSource: {
        type: 'string',
        description: 'Authentication database name (MongoDB)',
      },
      replicaSet: {
        type: 'string',
        description: 'Replica set name (MongoDB)',
      },
      db: {
        type: 'number',
        defaultValue: 0,
        description: 'Redis database number',
      },
      keyPrefix: {
        type: 'string',
        description: 'Key prefix for Redis operations',
      },
      filename: {
        type: 'string',
        description: 'Database file path (SQLite)',
      },
      node: {
        type: 'string',
        description: 'Elasticsearch node URL',
      },
      nodes: {
        type: 'array',
        description: 'Array of Elasticsearch node URLs',
      },
      apiKey: {
        type: 'string',
        description: 'API key for authentication',
      },
      keyspace: {
        type: 'string',
        description: 'Keyspace name (Cassandra)',
      },
      region: {
        type: 'string',
        description: 'AWS region (DynamoDB)',
      },
      accessKeyId: {
        type: 'string',
        description: 'AWS access key ID',
      },
      secretAccessKey: {
        type: 'string',
        description: 'AWS secret access key',
      },
      endpoint: {
        type: 'string',
        description: 'Custom endpoint URL',
      },
    };
  }

  /**
   * Get type-specific default values
   */
  private getTypeSpecificDefaults(type: DataSourceType): Record<string, any> {
    const databaseMeta = this.getDatabaseMetadata();
    const meta = databaseMeta[type];

    const defaults: Record<string, any> = {};

    if (meta?.defaultPort) {
      defaults.port = meta.defaultPort;
    }

    // Add more type-specific defaults as needed
    switch (type) {
      case DataSourceType.MONGODB:
        defaults.authSource = 'admin';
        break;
      case DataSourceType.SQLITE:
        defaults.filename = './database.sqlite';
        break;
      case DataSourceType.REDIS:
        defaults.db = 0;
        break;
      case DataSourceType.DYNAMODB:
        defaults.region = 'us-east-1';
        break;
    }

    return defaults;
  }
}
