import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { DataSourceChangeHistory } from '../../entities/repository/data-source-change-history.entity';

@Injectable()
export class DataSourceChangeHistoryRepository {
  constructor(
    @InjectRepository(DataSourceChangeHistory)
    private readonly repository: TypeOrmRepository<DataSourceChangeHistory>,
  ) {}

  async createFromData(changeData: Partial<DataSourceChangeHistory>): Promise<DataSourceChangeHistory> {
    const changeEntity = this.repository.create(changeData);
    return await this.repository.save(changeEntity);
  }

  async findByDataSourceId(dataSourceId: string): Promise<DataSourceChangeHistory[]> {
    return await this.repository.find({
      where: { dataSourceId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDataSourceIdPaginated(
    dataSourceId: string,
    skip: number,
    take: number,
  ): Promise<[DataSourceChangeHistory[], number]> {
    return await this.repository.findAndCount({
      where: { dataSourceId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  async findByUserId(userId: string): Promise<DataSourceChangeHistory[]> {
    return await this.repository.find({
      where: { userId },
      relations: ['dataSource', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteByDataSourceId(dataSourceId: string): Promise<void> {
    await this.repository.delete({ dataSourceId });
  }
}
