import { Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryService } from '../services/repository.service';
import { RepositoryFacade } from '../facades/repository.facade';
import { RepositoryMetadataRepository } from '../repositories/repository-metadata.repository';
import { RepositoryTransformer } from '../transformers/repository.transformer';
import { CreateRepositoryRequestDto } from '../dto/create-repository-request.dto';
import { UpdateRepositoryRequestDto } from '../dto/update-repository-request.dto';
import { RepositoryResponseDto } from '../dto/repository-response.dto';
import { GetWorkspaceRepositoriesQueryDto } from '../dto/get-workspace-repositories-query.dto';
import { PaginatedResponseDto } from '../../../../core/dto/paginated-response.dto';
import { RepositoryMetadata } from '../../entities/repository/repository-metadata.entity';

@Injectable()
export class RepositoryProvider {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly repositoryFacade: RepositoryFacade,
    private readonly repositoryMetadataRepository: RepositoryMetadataRepository,
  ) {}

  // Repository operations
  async createRepository(
    createRepositoryDto: CreateRepositoryRequestDto,
    workspaceId: string,
    userId: string,
  ): Promise<RepositoryResponseDto> {
    const repository = await this.repositoryFacade.createRepository(
      createRepositoryDto,
      workspaceId,
      userId,
    );

    return RepositoryTransformer.toResponseDto(repository);
  }

  async getRepositoryById(
    id: string,
    userId: string,
  ): Promise<RepositoryResponseDto> {
    const repository = await this.repositoryFacade.getRepositoryById(id);
    return RepositoryTransformer.toResponseDto(repository);
  }

  async getRepositoriesByWorkspace(
    workspaceId: string,
    query: GetWorkspaceRepositoriesQueryDto,
    userId: string,
  ): Promise<PaginatedResponseDto<RepositoryResponseDto>> {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const search = query.search;

    const [repositories, total] =
      await this.repositoryService.getRepositoriesByWorkspaceWithSearch(
        workspaceId,
        search,
        offset,
        limit,
      );

    const items = RepositoryTransformer.toResponseDtoArray(repositories);

    return new PaginatedResponseDto(items, offset, limit, total);
  }

  async updateRepository(
    id: string,
    updateRepositoryDto: UpdateRepositoryRequestDto,
    userId: string,
  ): Promise<RepositoryResponseDto> {
    const repository = await this.repositoryFacade.updateRepository(
      id,
      updateRepositoryDto,
      userId,
    );

    return RepositoryTransformer.toResponseDto(repository);
  }

  async deleteRepository(
    id: string,
    userId: string,
  ): Promise<{ message: string }> {
    await this.repositoryFacade.deleteRepository(id, userId);
    return { message: 'Repository successfully deleted' };
  }

  // Connection History operations (replacing data source change history)
  async getConnectionHistory(
    repositoryId: string,
    query: { offset?: number; limit?: number },
    userId: string,
  ): Promise<PaginatedResponseDto<any>> {
    // TODO: Create proper response DTO
    const offset = query.offset || 0;
    const limit = query.limit || 10;

    const [connectionHistory, total] =
      await this.repositoryFacade.getConnectionHistory(
        repositoryId,
        offset,
        limit,
      );

    // TODO: Transform connection history to proper response DTO
    const items = connectionHistory; // Temporary - need to create transformer

    return new PaginatedResponseDto(items, offset, limit, total);
  }

  /**
   * Update repository metadata
   */
  async updateRepositoryMetadata(
    repositoryId: string,
    updates: Partial<Pick<RepositoryMetadata, 'isPrivate' | 'isSaved'>>,
  ): Promise<void> {
    await this.repositoryMetadataRepository.updateByRepositoryId(
      repositoryId,
      updates,
    );
  }
}
