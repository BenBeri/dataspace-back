import { Injectable } from '@nestjs/common';
import { DataSourceChangeHistory } from '../../entities/repository/data-source-change-history.entity';
import { DataSourceChangeHistoryRepository } from '../repositories/data-source-change-history.repository';

@Injectable()
export class DataSourceChangeHistoryService {
  constructor(
    private readonly changeHistoryRepository: DataSourceChangeHistoryRepository,
  ) {}

  async recordChange(changeData: Partial<DataSourceChangeHistory>): Promise<DataSourceChangeHistory> {
    return await this.changeHistoryRepository.createFromData(changeData);
  }

  async getChangeHistoryByDataSourceId(dataSourceId: string): Promise<DataSourceChangeHistory[]> {
    return await this.changeHistoryRepository.findByDataSourceId(dataSourceId);
  }

  async getChangeHistoryByDataSourceIdPaginated(
    dataSourceId: string,
    skip: number,
    take: number,
  ): Promise<[DataSourceChangeHistory[], number]> {
    return await this.changeHistoryRepository.findByDataSourceIdPaginated(
      dataSourceId,
      skip,
      take,
    );
  }

  async getChangeHistoryByUserId(userId: string): Promise<DataSourceChangeHistory[]> {
    return await this.changeHistoryRepository.findByUserId(userId);
  }

  async deleteByDataSourceId(dataSourceId: string): Promise<void> {
    await this.changeHistoryRepository.deleteByDataSourceId(dataSourceId);
  }
}
