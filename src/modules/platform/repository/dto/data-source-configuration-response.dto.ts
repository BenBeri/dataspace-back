import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class DataSourceConfigurationResponseDto {
  id: string;
  name: string;
  type: DataSourceType;
  configuration: Record<string, any>;
  repositoryId: string;
  createdAt: Date;
  updatedAt: Date;
}
