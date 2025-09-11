import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class UpdateRepositoryRequestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(DataSourceType)
  type?: DataSourceType;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
