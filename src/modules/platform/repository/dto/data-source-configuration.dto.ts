import { IsString, IsNotEmpty, IsEnum, IsObject } from 'class-validator';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class DataSourceConfigurationDto {
  @IsString()
  @IsNotEmpty()
  dataSourceName: string;

  @IsEnum(DataSourceType)
  @IsNotEmpty()
  dataSourceType: DataSourceType;

  @IsObject()
  @IsNotEmpty()
  configuration: Record<string, any>;
}
