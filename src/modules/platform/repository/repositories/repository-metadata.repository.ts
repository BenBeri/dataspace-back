import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { RepositoryMetadata } from '../../entities/repository/repository-metadata.entity';

@Injectable()
export class RepositoryMetadataRepository {
  constructor(
    @InjectRepository(RepositoryMetadata)
    private readonly repositoryMetadata: TypeOrmRepository<RepositoryMetadata>,
  ) {}

  async create(
    repositoryId: string,
    isPrivate: boolean = false,
    isSaved: boolean = false,
  ): Promise<RepositoryMetadata> {
    const metadata = this.repositoryMetadata.create({
      repositoryId,
      isPrivate,
      isSaved,
    });
    return await this.repositoryMetadata.save(metadata);
  }

  async findByRepositoryId(
    repositoryId: string,
  ): Promise<RepositoryMetadata | null> {
    return await this.repositoryMetadata.findOne({
      where: { repositoryId },
    });
  }

  async updateByRepositoryId(
    repositoryId: string,
    updates: Partial<Pick<RepositoryMetadata, 'isPrivate' | 'isSaved'>>,
  ): Promise<void> {
    await this.repositoryMetadata.update({ repositoryId }, updates);
  }

  async deleteByRepositoryId(repositoryId: string): Promise<void> {
    await this.repositoryMetadata.delete({ repositoryId });
  }
}
