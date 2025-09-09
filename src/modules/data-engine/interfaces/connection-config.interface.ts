/**
 * Generic connection configuration interface
 * Supports various database types with their specific configuration requirements
 */
export interface IConnectionConfig {
  // Common connection settings
  connectionTimeout?: number;
  poolMin?: number;
  poolMax?: number;
  
  // SQL databases (PostgreSQL, MySQL, MSSQL, Oracle, SQLite)
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  schema?: string;
  ssl?: boolean | object;
  
  // MongoDB specific
  connectionString?: string;
  authSource?: string;
  replicaSet?: string;
  
  // Redis specific
  db?: number;
  keyPrefix?: string;
  
  // SQLite specific
  filename?: string;
  
  // Elasticsearch specific
  node?: string;
  nodes?: string[];
  apiKey?: string;
  
  // Generic key-value pairs for extended configuration
  extra?: Record<string, any>;
}
