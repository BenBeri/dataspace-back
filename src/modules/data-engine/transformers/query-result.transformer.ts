import { DataSourceType } from '../../platform/entities/enums/data-source-type.enum';
import {
  QueryResultResponseDto,
  BatchQueryResultResponseDto,
  TransactionResultResponseDto,
} from '../dto/query-result-response.dto';
import {
  ConnectionStatusResponseDto,
  RepositoryConnectionInfoResponseDto,
  PoolStatisticsResponseDto,
} from '../dto/connection-status-response.dto';

/**
 * Static transformer for query results and responses
 * Following project convention for transformers as static classes
 */
export class QueryResultTransformer {
  /**
   * Transform query execution result to response DTO
   */
  static toQueryResponse(
    data: any,
    executionTime: number,
    type: DataSourceType,
    query?: string,
  ): QueryResultResponseDto {
    return {
      success: true,
      data,
      rowCount: Array.isArray(data) ? data.length : undefined,
      executionTime,
      type,
    };
  }

  /**
   * Transform batch query results to response DTO
   */
  static toBatchQueryResponse(
    results: any[],
    totalExecutionTime: number,
    type: DataSourceType,
  ): BatchQueryResultResponseDto {
    return {
      success: true,
      results,
      totalExecutionTime,
      type,
      queryCount: results.length,
    };
  }

  /**
   * Transform transaction result to response DTO
   */
  static toTransactionResponse(
    data: any,
    executionTime: number,
    type: DataSourceType,
  ): TransactionResultResponseDto {
    return {
      success: true,
      data,
      executionTime,
      type,
    };
  }

  /**
   * Transform error to response DTO
   */
  static toErrorResponse(
    error: Error,
    executionTime?: number,
    type?: DataSourceType,
  ): QueryResultResponseDto {
    return {
      success: false,
      data: null,
      executionTime: executionTime || 0,
      type: type || DataSourceType.POSTGRES, // Default fallback
      error: error.message,
    };
  }

  /**
   * Transform connection status to response DTO
   */
  static toConnectionStatusResponse(
    workspaceId: string,
    repositoryId: string,
    type: DataSourceType | null,
    status: 'healthy' | 'unhealthy' | 'disconnected',
    connectedAt?: Date,
    responseTime?: number,
    error?: string,
  ): ConnectionStatusResponseDto {
    return {
      workspaceId,
      repositoryId,
      type,
      status,
      connectedAt,
      responseTime,
      error,
    };
  }

  /**
   * Transform repository connection info to response DTO
   */
  static toRepositoryConnectionInfoResponse(
    workspaceId: string,
    repositoryId: string,
    credentialsName: string | null,
    type: DataSourceType,
    status: 'healthy' | 'unhealthy' | 'disconnected' | 'no-connection',
    connectedAt?: Date,
  ): RepositoryConnectionInfoResponseDto {
    return {
      workspaceId,
      repositoryId,
      credentialsName,
      type,
      status,
      connectedAt,
    };
  }

  /**
   * Transform pool statistics to response DTO
   */
  static toPoolStatisticsResponse(
    totalConnections: number,
    activeConnections: number,
    connectionsByType: Record<DataSourceType, number>,
    connectionsByWorkspace: Record<string, number>,
  ): PoolStatisticsResponseDto {
    return {
      totalConnections,
      activeConnections,
      connectionsByType,
      connectionsByWorkspace,
      timestamp: new Date(),
    };
  }

  /**
   * Format execution time for human readability
   */
  static formatExecutionTime(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Sanitize query for logging (remove sensitive data)
   */
  static sanitizeQueryForLogging(query: string): string {
    // Remove potential sensitive data patterns
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/password\s*=\s*"[^"]*"/gi, 'password="***"')
      .replace(/pwd\s*=\s*'[^']*'/gi, "pwd='***'")
      .replace(/pwd\s*=\s*"[^"]*"/gi, 'pwd="***"')
      .trim();
  }

  /**
   * Get database-specific query metrics
   */
  static getQueryMetrics(
    type: DataSourceType,
    result: any,
  ): {
    affectedRows?: number;
    insertedId?: any;
    changedRows?: number;
  } {
    switch (type) {
      case DataSourceType.POSTGRES:
        // PostgreSQL specific metrics
        if (result && typeof result === 'object' && 'affectedRows' in result) {
          return {
            affectedRows: result.affectedRows,
          };
        }
        return {};

      case DataSourceType.MYSQL:
        // MySQL specific metrics
        if (result && typeof result === 'object') {
          return {
            affectedRows: result.affectedRows,
            insertedId: result.insertId,
            changedRows: result.changedRows,
          };
        }
        return {};

      default:
        return {};
    }
  }
}
