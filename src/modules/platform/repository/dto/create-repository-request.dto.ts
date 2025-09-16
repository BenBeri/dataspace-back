import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
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
}
