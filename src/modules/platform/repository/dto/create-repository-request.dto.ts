import { IsString, IsNotEmpty, IsOptional, IsBoolean, ValidateNested, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDataSourceRequestDto } from './create-data-source-request.dto';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class CreateRepositoryRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(DataSourceType)
  @IsNotEmpty()
  type: DataSourceType;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDataSourceRequestDto)
  dataSources?: CreateDataSourceRequestDto[];
}
