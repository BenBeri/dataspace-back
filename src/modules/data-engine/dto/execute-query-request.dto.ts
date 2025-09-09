import { IsString, IsNotEmpty, IsArray, IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * DTO for query execution requests
 */
export class ExecuteQueryRequestDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsArray()
  @IsOptional()
  params?: any[];

  @IsNumber()
  @Min(1000) // Minimum 1 second
  @Max(300000) // Maximum 5 minutes
  @IsOptional()
  timeout?: number;
}

/**
 * DTO for batch query execution requests
 */
export class ExecuteBatchQueriesRequestDto {
  @IsArray()
  @IsNotEmpty()
  queries: Array<{
    query: string;
    params?: any[];
  }>;

  @IsNumber()
  @Min(1000)
  @Max(600000) // Maximum 10 minutes for batch
  @IsOptional()
  timeout?: number;
}
