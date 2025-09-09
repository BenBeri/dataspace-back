import { IsString, IsOptional, IsBoolean, MaxLength, Matches, IsEnum } from 'class-validator';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class UpdateRepositoryRequestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'repositoryNameKey can only contain lowercase letters, numbers, and single dashes (not at start/end)'
  })
  repositoryNameKey?: string;

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
