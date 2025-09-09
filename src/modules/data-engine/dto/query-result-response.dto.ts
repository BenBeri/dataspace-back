import { DataSourceType } from '../../platform/entities/enums/data-source-type.enum';

/**
 * DTO for query execution response
 */
export class QueryResultResponseDto {
  success: boolean;
  data: any;
  rowCount?: number;
  executionTime: number; // milliseconds
  type: DataSourceType;
  error?: string;
}

/**
 * DTO for batch query execution response
 */
export class BatchQueryResultResponseDto {
  success: boolean;
  results: any[];
  totalExecutionTime: number; // milliseconds
  type: DataSourceType;
  queryCount: number;
  error?: string;
}

/**
 * DTO for transaction execution response
 */
export class TransactionResultResponseDto {
  success: boolean;
  data: any;
  executionTime: number; // milliseconds
  type: DataSourceType;
  error?: string;
}
