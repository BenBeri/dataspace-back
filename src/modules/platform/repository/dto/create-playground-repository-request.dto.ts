import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class PlaygroundCredentialsDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  config: Record<string, any>;
}

export class CreatePlaygroundRepositoryRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(DataSourceType)
  @IsNotEmpty()
  type: DataSourceType;

  @ValidateNested()
  @Type(() => PlaygroundCredentialsDto)
  @IsOptional()
  credentials?: PlaygroundCredentialsDto;
}
