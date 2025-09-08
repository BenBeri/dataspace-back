import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { DataSource } from '../../entities/repository/data-source.entity';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';

@Injectable()
export class DataSourceRepository {
  constructor(
    @InjectRepository(DataSource)
    private readonly repository: TypeOrmRepository<DataSource>,
  ) {}

  async createFromData(dataSourceData: Partial<DataSource>): Promise<DataSource> {
    const dataSourceEntity = this.repository.create(dataSourceData);
    return await this.repository.save(dataSourceEntity);
  }

  async findById(id: string): Promise<DataSource | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['repository', 'changeHistory'],
    });
  }

  async findByRepositoryId(repositoryId: string): Promise<DataSource | null> {
    return await this.repository.findOne({
      where: { repositoryId },
      relations: ['changeHistory'],
    });
  }

  async findAllByRepositoryId(repositoryId: string): Promise<DataSource[]> {
    return await this.repository.find({
      where: { repositoryId },
      relations: ['changeHistory'],
      order: { createdAt: 'ASC' },
    });
  }

  async updateWithData(id: string, updateData: Partial<DataSource>): Promise<void> {
    await this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteByRepositoryId(repositoryId: string): Promise<void> {
    await this.repository.delete({ repositoryId });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id },
    });
    return count > 0;
  }

  async existsByRepositoryId(repositoryId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { repositoryId },
    });
    return count > 0;
  }

  async findByIdAndRepositoryId(id: string, repositoryId: string): Promise<DataSource | null> {
    return await this.repository.findOne({
      where: { id, repositoryId },
      relations: ['changeHistory'],
    });
  }
}
