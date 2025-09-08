import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class DataSourceResponseDto {
  id: string;
  name: string;
  type: DataSourceType;
  repositoryId: string;
  createdAt: Date;
  updatedAt: Date;
}
