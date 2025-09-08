import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class UpdateDataSourceRequestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(DataSourceType)
  @IsOptional()
  type?: DataSourceType;

  @IsObject()
  @IsOptional()
  configuration?: Record<string, any>;
}
