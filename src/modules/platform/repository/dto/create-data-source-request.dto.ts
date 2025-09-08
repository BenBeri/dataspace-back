import { IsString, IsNotEmpty, IsEnum, IsObject } from 'class-validator';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class CreateDataSourceRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(DataSourceType)
  @IsNotEmpty()
  type: DataSourceType;

  @IsObject()
  @IsNotEmpty()
  configuration: Record<string, any>;
}
