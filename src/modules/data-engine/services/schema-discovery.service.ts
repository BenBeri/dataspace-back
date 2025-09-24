import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DataSourceType } from '../../platform/entities/enums/data-source-type.enum';

/**
 * Schema Discovery Service
 * Provides database schema introspection capabilities using TypeORM
 */
@Injectable()
export class SchemaDiscoveryService {
  private readonly logger = new Logger(SchemaDiscoveryService.name);

  /**
   * Discover all tables in the database
   */
  async discoverTables(
    connection: DataSource,
    dbType: DataSourceType,
  ): Promise<TableInfo[]> {
    this.logger.debug(`Discovering tables for ${dbType} database`);

    try {
      let query: string;

      switch (dbType) {
        case DataSourceType.POSTGRES:
          query = `
            SELECT 
              t.table_name,
              t.table_type,
              obj_description(c.oid) as table_comment
            FROM information_schema.tables t
            LEFT JOIN pg_class c ON c.relname = t.table_name
            WHERE t.table_schema = 'public' 
              AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_name
          `;
          break;

        case DataSourceType.MYSQL:
          query = `
            SELECT 
              table_name,
              table_type,
              table_comment
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
          `;
          break;

        default:
          throw new Error(`Schema discovery not implemented for ${dbType}`);
      }

      const rawTables = await connection.query(query);

      // Get detailed column information for each table
      const tablesWithColumns = await Promise.all(
        rawTables.map(async (table: any) => {
          const columns = await this.discoverTableColumns(
            connection,
            table.table_name,
            dbType,
          );

          return {
            name: table.table_name,
            type: 'table',
            comment: table.table_comment || table.table_comment,
            columns,
          };
        }),
      );

      this.logger.log(`Discovered ${tablesWithColumns.length} tables`);
      return tablesWithColumns;
    } catch (error) {
      this.logger.error(`Failed to discover tables: ${error.message}`);
      throw error;
    }
  }

  /**
   * Discover all views in the database
   */
  async discoverViews(
    connection: DataSource,
    dbType: DataSourceType,
  ): Promise<ViewInfo[]> {
    this.logger.debug(`Discovering views for ${dbType} database`);

    try {
      let query: string;

      switch (dbType) {
        case DataSourceType.POSTGRES:
          query = `
            SELECT 
              table_name as view_name,
              view_definition
            FROM information_schema.views 
            WHERE table_schema = 'public'
            ORDER BY table_name
          `;
          break;

        case DataSourceType.MYSQL:
          query = `
            SELECT 
              table_name as view_name,
              view_definition
            FROM information_schema.views 
            WHERE table_schema = DATABASE()
            ORDER BY table_name
          `;
          break;

        default:
          throw new Error(`View discovery not implemented for ${dbType}`);
      }

      const rawViews = await connection.query(query);

      const views = rawViews.map((view: any) => ({
        name: view.view_name,
        type: 'view',
        definition: view.view_definition,
      }));

      this.logger.log(`Discovered ${views.length} views`);
      return views;
    } catch (error) {
      this.logger.error(`Failed to discover views: ${error.message}`);
      throw error;
    }
  }

  /**
   * Discover indexes for a specific table
   */
  async discoverIndexes(
    connection: DataSource,
    tableName: string,
    dbType: DataSourceType,
  ): Promise<IndexInfo[]> {
    this.logger.debug(
      `Discovering indexes for table ${tableName} in ${dbType} database`,
    );

    try {
      let query: string;

      switch (dbType) {
        case DataSourceType.POSTGRES:
          query = `
            SELECT 
              indexname as index_name,
              indexdef as index_definition,
              schemaname,
              tablename
            FROM pg_indexes 
            WHERE tablename = $1 
              AND schemaname = 'public'
            ORDER BY indexname
          `;
          break;

        case DataSourceType.MYSQL:
          query = `
            SELECT 
              index_name,
              column_name,
              non_unique,
              index_type
            FROM information_schema.statistics 
            WHERE table_name = ? 
              AND table_schema = DATABASE()
            ORDER BY index_name, seq_in_index
          `;
          break;

        default:
          throw new Error(`Index discovery not implemented for ${dbType}`);
      }

      const rawIndexes = await connection.query(query, [tableName]);

      const indexes = rawIndexes.map((index: any) => ({
        name: index.index_name || index.indexname,
        tableName: tableName,
        definition: index.index_definition || index.indexdef,
        isUnique: !index.non_unique,
        type: index.index_type || 'btree',
      }));

      this.logger.debug(
        `Discovered ${indexes.length} indexes for table ${tableName}`,
      );
      return indexes;
    } catch (error) {
      this.logger.error(
        `Failed to discover indexes for table ${tableName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Discover columns for a specific table
   */
  private async discoverTableColumns(
    connection: DataSource,
    tableName: string,
    dbType: DataSourceType,
  ): Promise<ColumnInfo[]> {
    let query: string;

    switch (dbType) {
      case DataSourceType.POSTGRES:
        query = `
          SELECT 
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            c.character_maximum_length,
            c.numeric_precision,
            c.numeric_scale,
            col_description(pgc.oid, c.ordinal_position) as column_comment,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
          FROM information_schema.columns c
          LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
          LEFT JOIN (
            SELECT ku.column_name
            FROM information_schema.table_constraints tc
            INNER JOIN information_schema.key_column_usage ku 
              ON tc.constraint_name = ku.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND tc.table_name = $1
              AND tc.table_schema = 'public'
          ) pk ON pk.column_name = c.column_name
          WHERE c.table_name = $1 
            AND c.table_schema = 'public'
          ORDER BY c.ordinal_position
        `;
        break;

      case DataSourceType.MYSQL:
        query = `
          SELECT 
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            c.character_maximum_length,
            c.numeric_precision,
            c.numeric_scale,
            c.column_comment,
            CASE WHEN c.column_key = 'PRI' THEN true ELSE false END as is_primary_key
          FROM information_schema.columns c
          WHERE c.table_name = ? 
            AND c.table_schema = DATABASE()
          ORDER BY c.ordinal_position
        `;
        break;

      default:
        throw new Error(`Column discovery not implemented for ${dbType}`);
    }

    const rawColumns = await connection.query(query, [tableName]);

    return rawColumns.map((col: any) => ({
      name: col.column_name,
      type: col.data_type,
      isNullable: col.is_nullable === 'YES',
      isPrimary: col.is_primary_key,
      default: col.column_default,
      maxLength: col.character_maximum_length,
      precision: col.numeric_precision,
      scale: col.numeric_scale,
      comment: col.column_comment,
    }));
  }
}

// Type definitions for schema discovery results
export interface TableInfo {
  name: string;
  type: 'table';
  comment?: string;
  columns: ColumnInfo[];
}

export interface ViewInfo {
  name: string;
  type: 'view';
  definition: string;
}

export interface IndexInfo {
  name: string;
  tableName: string;
  definition?: string;
  isUnique: boolean;
  type: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimary: boolean;
  default?: string;
  maxLength?: number;
  precision?: number;
  scale?: number;
  comment?: string;
}
