import { Expose } from 'class-transformer';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class DatabaseConfigFieldDto {
  @Expose()
  name: string;

  @Expose()
  type: string;

  @Expose()
  required: boolean;

  @Expose()
  defaultValue?: any;

  @Expose()
  description?: string;
}

export class DatabaseInfoDto {
  @Expose()
  type: DataSourceType;

  @Expose()
  name: string;

  @Expose()
  implemented: boolean;

  @Expose()
  description?: string;

  @Expose()
  configFields?: DatabaseConfigFieldDto[];

  @Expose()
  defaultPort?: number;
}

export class SupportedDatabasesResponseDto {
  @Expose()
  databases: DatabaseInfoDto[];

  @Expose()
  totalCount: number;
}
