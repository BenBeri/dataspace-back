import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { RepositoryCredentials } from '../../entities/repository/repository-credentials.entity';

@Injectable()
export class RepositoryCredentialsRepository {
  constructor(
    @InjectRepository(RepositoryCredentials)
    private readonly repository: TypeOrmRepository<RepositoryCredentials>,
  ) {}

  /**
   * Find all credentials for a repository
   */
  async findByRepositoryId(
    repositoryId: string,
  ): Promise<RepositoryCredentials[]> {
    return await this.repository.find({
      where: { repositoryId },
      relations: ['credentialsAccess'],
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * Create new credentials
   */
  async create(
    credentialsData: Partial<RepositoryCredentials>,
  ): Promise<RepositoryCredentials> {
    const entity = this.repository.create(credentialsData);
    return await this.repository.save(entity);
  }

  /**
   * Find by ID with relations
   */
  async findById(id: string): Promise<RepositoryCredentials | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['credentialsAccess', 'repository'],
    });
  }

  /**
   * Update with data
   */
  async updateWithData(
    id: string,
    updateData: Partial<RepositoryCredentials>,
  ): Promise<void> {
    await this.repository.update(id, updateData);
  }

  /**
   * Delete credentials
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Find active credentials for a repository
   */
  async findActiveByRepositoryId(
    repositoryId: string,
  ): Promise<RepositoryCredentials[]> {
    return await this.repository.find({
      where: { repositoryId, isActive: true },
      relations: ['credentialsAccess'],
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * Find default credentials for a repository
   */
  async findDefaultByRepositoryId(
    repositoryId: string,
  ): Promise<RepositoryCredentials | null> {
    return await this.repository.findOne({
      where: { repositoryId, isDefault: true, isActive: true },
      relations: ['credentialsAccess'],
    });
  }

  /**
   * Find credentials by repository and name
   */
  async findByRepositoryIdAndName(
    repositoryId: string,
    name: string,
  ): Promise<RepositoryCredentials | null> {
    return await this.repository.findOne({
      where: { repositoryId, name },
      relations: ['credentialsAccess'],
    });
  }

  /**
   * Check if default credentials exist for repository
   */
  async hasDefaultCredentials(repositoryId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { repositoryId, isDefault: true, isActive: true },
    });
    return count > 0;
  }
}
