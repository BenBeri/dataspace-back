import { Injectable } from '@nestjs/common';
import { RepositoryConnectionHistory } from '../../entities/repository/repository-connection-history.entity';
import { RepositoryConnectionHistoryRepository } from '../repositories/repository-connection-history.repository';

@Injectable()
export class RepositoryConnectionHistoryService {
  constructor(
    private readonly connectionHistoryRepository: RepositoryConnectionHistoryRepository,
  ) {}

  async recordChange(
    changeData: Partial<RepositoryConnectionHistory>,
  ): Promise<RepositoryConnectionHistory> {
    return await this.connectionHistoryRepository.createFromData(changeData);
  }

  async getConnectionHistoryByRepositoryId(
    repositoryId: string,
  ): Promise<RepositoryConnectionHistory[]> {
    return await this.connectionHistoryRepository.findByRepositoryId(
      repositoryId,
    );
  }

  async getConnectionHistoryByRepositoryIdPaginated(
    repositoryId: string,
    skip: number,
    take: number,
  ): Promise<[RepositoryConnectionHistory[], number]> {
    return await this.connectionHistoryRepository.findByRepositoryIdPaginated(
      repositoryId,
      skip,
      take,
    );
  }

  async getConnectionHistoryByUserId(
    userId: string,
  ): Promise<RepositoryConnectionHistory[]> {
    return await this.connectionHistoryRepository.findByUserId(userId);
  }

  async deleteByRepositoryId(repositoryId: string): Promise<void> {
    await this.connectionHistoryRepository.deleteByRepositoryId(repositoryId);
  }

  async getConnectionHistory(
    repositoryId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[RepositoryConnectionHistory[], number]> {
    return await this.connectionHistoryRepository.findByRepositoryIdPaginated(
      repositoryId,
      skip,
      take,
    );
  }

  async recordConnectionChange(
    changeData: any,
  ): Promise<RepositoryConnectionHistory> {
    return await this.recordChange(changeData);
  }
}
