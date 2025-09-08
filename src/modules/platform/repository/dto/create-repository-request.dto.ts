import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, Matches, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDataSourceRequestDto } from './create-data-source-request.dto';

export class CreateRepositoryRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'repositoryNameKey can only contain lowercase letters, numbers, and single dashes (not at start/end)'
  })
  repositoryNameKey?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDataSourceRequestDto)
  dataSources?: CreateDataSourceRequestDto[];
}
