import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { RepositoryConnectionHistory } from '../../entities/repository/repository-connection-history.entity';

@Injectable()
export class RepositoryConnectionHistoryRepository {
  constructor(
    @InjectRepository(RepositoryConnectionHistory)
    private readonly repository: TypeOrmRepository<RepositoryConnectionHistory>,
  ) {}

  async createFromData(
    changeData: Partial<RepositoryConnectionHistory>,
  ): Promise<RepositoryConnectionHistory> {
    const changeEntity = this.repository.create(changeData);
    return await this.repository.save(changeEntity);
  }

  async findByRepositoryId(
    repositoryId: string,
  ): Promise<RepositoryConnectionHistory[]> {
    return await this.repository.find({
      where: { repositoryId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByRepositoryIdPaginated(
    repositoryId: string,
    skip: number,
    take: number,
  ): Promise<[RepositoryConnectionHistory[], number]> {
    return await this.repository.findAndCount({
      where: { repositoryId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
  }

  async findByUserId(userId: string): Promise<RepositoryConnectionHistory[]> {
    return await this.repository.find({
      where: { userId },
      relations: ['repository', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteByRepositoryId(repositoryId: string): Promise<void> {
    await this.repository.delete({ repositoryId });
  }
}
