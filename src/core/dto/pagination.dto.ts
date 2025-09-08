import { IsOptional, IsPositive, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'Offset must be at least 0' })
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: 'Limit must be a positive number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  // Helper method to get skip value for TypeORM
  getSkip(): number {
    return this.offset ?? 0;
  }

  // Helper method to get take value for TypeORM
  getTake(): number {
    return this.limit ?? 10;
  }

  // Helper method to calculate page number (for response metadata)
  getPage(): number {
    const offset = this.offset ?? 0;
    const limit = this.limit ?? 10;
    return Math.floor(offset / limit) + 1;
  }
}
