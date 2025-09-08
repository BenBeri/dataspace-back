import { Injectable } from '@nestjs/common';
import { RepositoryService } from '../services/repository.service';
import { RepositoryFacade } from '../facades/repository.facade';
import { RepositoryTransformer } from '../transformers/repository.transformer';
import { DataSourceTransformer } from '../transformers/data-source.transformer';
import { CreateRepositoryRequestDto } from '../dto/create-repository-request.dto';
import { UpdateRepositoryRequestDto } from '../dto/update-repository-request.dto';
import { UpdateDataSourceRequestDto } from '../dto/update-data-source-request.dto';
import { RepositoryResponseDto } from '../dto/repository-response.dto';
import { DataSourceResponseDto } from '../dto/data-source-response.dto';
import { DataSourceChangeHistoryResponseDto } from '../dto/data-source-change-history-response.dto';
import { DataSourceConfigurationResponseDto } from '../dto/data-source-configuration-response.dto';
import { GetWorkspaceRepositoriesQueryDto } from '../dto/get-workspace-repositories-query.dto';
import { PaginatedResponseDto } from '../../../../core/dto/paginated-response.dto';

@Injectable()
export class RepositoryProvider {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly repositoryFacade: RepositoryFacade,
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

    const [repositories, total] = await this.repositoryService.getRepositoriesByWorkspaceWithSearch(
      workspaceId,
      search,
      offset,
      limit,
    );

    const items = RepositoryTransformer.toResponseDtoArray(repositories);

    return new PaginatedResponseDto(
      items,
      offset,
      limit,
      total,
    );
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

  // Data source operations (no separate creation - created with repository)

  async getDataSourceByRepositoryId(
    repositoryId: string,
    userId: string,
  ): Promise<DataSourceResponseDto | null> {
    const dataSource = await this.repositoryFacade.getDataSourceByRepositoryId(repositoryId);
    
    if (!dataSource) {
      return null;
    }
    
    return DataSourceTransformer.toResponseDto(dataSource);
  }

  async getDataSourceConfiguration(
    repositoryId: string,
    userId: string,
  ): Promise<DataSourceConfigurationResponseDto | null> {
    const dataSource = await this.repositoryFacade.getDataSourceByRepositoryId(repositoryId);
    
    if (!dataSource) {
      return null;
    }

    const configuration = await this.repositoryFacade.getDataSourceConfiguration(repositoryId);
    
    if (!configuration) {
      return null;
    }

    return DataSourceTransformer.toConfigurationResponseDto(dataSource, configuration);
  }

  async updateDataSource(
    repositoryId: string,
    dataSourceId: string,
    updateDataSourceDto: UpdateDataSourceRequestDto,
    userId: string,
  ): Promise<DataSourceResponseDto> {
    const dataSource = await this.repositoryFacade.updateDataSource(
      repositoryId,
      dataSourceId,
      updateDataSourceDto,
      userId,
    );

    return DataSourceTransformer.toResponseDto(dataSource);
  }

  async deleteDataSource(
    repositoryId: string,
    dataSourceId: string,
    userId: string,
  ): Promise<{ message: string }> {
    await this.repositoryFacade.deleteDataSource(
      repositoryId,
      dataSourceId,
      userId,
    );
    return { message: 'Data source successfully deleted' };
  }

  // Change history operations
  async getDataSourceChangeHistory(
    repositoryId: string,
    dataSourceId: string,
    query: { offset?: number; limit?: number },
    userId: string,
  ): Promise<PaginatedResponseDto<DataSourceChangeHistoryResponseDto>> {
    const offset = query.offset || 0;
    const limit = query.limit || 10;

    const [changeHistory, total] = await this.repositoryFacade.getDataSourceChangeHistoryPaginated(
      repositoryId,
      dataSourceId,
      offset,
      limit,
    );

    const items = DataSourceTransformer.changeHistoryToResponseDtoArray(changeHistory);

    return new PaginatedResponseDto(
      items,
      offset,
      limit,
      total,
    );
  }
}
