import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Repository } from '../../entities/repository/repository.entity';

@Injectable()
export class RepositoryRepository {
  constructor(
    @InjectRepository(Repository)
    private readonly repository: TypeOrmRepository<Repository>,
  ) {}

  async create(name: string, description: string, workspaceId: string): Promise<Repository> {
    const repositoryEntity = this.repository.create({
      name,
      description,
      workspaceId,
    });
    return await this.repository.save(repositoryEntity);
  }

  async createFromData(repositoryData: Partial<Repository>): Promise<Repository> {
    const repositoryEntity = this.repository.create(repositoryData);
    return await this.repository.save(repositoryEntity);
  }

  async findById(id: string): Promise<Repository | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['workspace', 'dataSources'],
    });
  }

  async findByWorkspaceId(workspaceId: string): Promise<Repository[]> {
    return await this.repository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByWorkspaceIdPaginated(
    workspaceId: string,
    skip: number,
    take: number,
  ): Promise<[Repository[], number]> {
    return await this.repository.findAndCount({
      where: { workspaceId },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async findByWorkspaceIdWithSearch(
    workspaceId: string,
    search?: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Repository[], number]> {
    const queryBuilder = this.repository.createQueryBuilder('repository')
      .leftJoinAndSelect('repository.workspace', 'workspace')
      .leftJoinAndSelect('repository.dataSources', 'dataSources');
    
    queryBuilder.where('repository.workspaceId = :workspaceId', { workspaceId });

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(repository.name LIKE :search OR repository.description LIKE :search)',
        { search: searchTerm }
      );
    }

    queryBuilder
      .orderBy('repository.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    return await queryBuilder.getManyAndCount();
  }

  async findAllPaginated(skip: number, take: number): Promise<[Repository[], number]> {
    return await this.repository.findAndCount({
      skip,
      take,
      order: { createdAt: 'DESC' },
      relations: ['workspace', 'dataSources'],
    });
  }

  async update(id: string, updates: Partial<Repository>): Promise<Repository> {
    await this.repository.update(id, updates);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error(`Repository with ID ${id} not found after update`);
    }
    return updated;
  }

  async updateWithData(id: string, updateData: Partial<Repository>): Promise<void> {
    await this.repository.update(id, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async existsByIdAndWorkspaceId(id: string, workspaceId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id, workspaceId },
    });
    return count > 0;
  }

  async findByIdAndWorkspaceId(id: string, workspaceId: string): Promise<Repository | null> {
    return await this.repository.findOne({
      where: { id, workspaceId },
      relations: ['workspace', 'dataSources'],
    });
  }
}
