import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetSupportedDatabasesQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeConfig?: boolean = false;
}
