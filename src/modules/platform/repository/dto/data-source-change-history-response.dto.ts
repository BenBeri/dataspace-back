import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class DataSourceChangeHistoryResponseDto {
  id: string;
  dataSourceId: string;
  userId: string;
  userName?: string; // Will be populated from user relation
  previousName?: string;
  newName?: string;
  previousType?: DataSourceType;
  newType?: DataSourceType;
  configurationChanged?: boolean;
  changeDescription: string;
  createdAt: Date;
}
