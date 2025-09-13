import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DataSourceType } from '../../platform/entities/enums/data-source-type.enum';

/**
 * Configuration object for database connection testing
 * Based on IConnectionConfig interface but with validation decorators
 */
export class ConnectionConfigDto {
  // Common connection settings
  @IsNumber()
  @IsOptional()
  connectionTimeout?: number;

  @IsNumber()
  @IsOptional()
  poolMin?: number;

  @IsNumber()
  @IsOptional()
  poolMax?: number;

  // SQL databases (PostgreSQL, MySQL, MSSQL, Oracle, SQLite)
  @IsString()
  @IsOptional()
  host?: string;

  @IsNumber()
  @IsOptional()
  port?: number;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  database?: string;

  @IsString()
  @IsOptional()
  schema?: string;

  @IsOptional()
  ssl?: boolean | object;

  // MongoDB specific
  @IsString()
  @IsOptional()
  connectionString?: string;

  @IsString()
  @IsOptional()
  authSource?: string;

  @IsString()
  @IsOptional()
  replicaSet?: string;

  // Redis specific
  @IsNumber()
  @IsOptional()
  db?: number;

  @IsString()
  @IsOptional()
  keyPrefix?: string;

  // SQLite specific
  @IsString()
  @IsOptional()
  filename?: string;

  // Elasticsearch specific
  @IsString()
  @IsOptional()
  node?: string;

  @IsOptional()
  nodes?: string[];

  @IsString()
  @IsOptional()
  apiKey?: string;

  // Generic key-value pairs for extended configuration
  @IsObject()
  @IsOptional()
  extra?: Record<string, any>;
}

/**
 * DTO for database connection test requests
 * Allows testing connection without saving to datasource
 */
export class TestConnectionRequestDto {
  @IsEnum(DataSourceType)
  @IsNotEmpty()
  type: DataSourceType;

  @ValidateNested()
  @Type(() => ConnectionConfigDto)
  @IsNotEmpty()
  config: ConnectionConfigDto;

  @IsNumber()
  @IsOptional()
  timeoutMs?: number = 10000; // Default 10 seconds timeout
}
