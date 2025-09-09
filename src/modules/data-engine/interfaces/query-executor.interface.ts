/**
 * Query execution interface for advanced query operations
 * Provides additional query execution capabilities beyond basic execute
 */
export interface IQueryExecutor {
  // Basic query execution
  execute<T = any>(query: string, params?: any[]): Promise<T>;
  
  // Batch query execution for performance optimization
  executeBatch<T = any>(queries: Array<{
    query: string;
    params?: any[];
  }>): Promise<T[]>;
  
  // Streaming query results for large datasets
  executeStream?(query: string, params?: any[]): AsyncGenerator<any>;
  
  // Prepared statements for repeated queries (SQL databases)
  prepare?(query: string): Promise<IPreparedStatement>;
}

/**
 * Prepared statement interface for SQL databases
 */
export interface IPreparedStatement {
  execute<T = any>(params?: any[]): Promise<T>;
  executeBatch<T = any>(paramSets: any[][]): Promise<T[]>;
  release(): Promise<void>;
}
