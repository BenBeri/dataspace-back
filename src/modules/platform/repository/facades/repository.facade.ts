import { Injectable, NotFoundException } from '@nestjs/common';
import { RepositoryService } from '../services/repository.service';
import { DataSourceService } from '../services/data-source.service';
import { DataSourceChangeHistoryService } from '../services/data-source-change-history.service';
import { Repository } from '../../entities/repository/repository.entity';
import { DataSource } from '../../entities/repository/data-source.entity';
import { DataSourceChangeHistory } from '../../entities/repository/data-source-change-history.entity';
import { CreateRepositoryRequestDto } from '../dto/create-repository-request.dto';
import { UpdateRepositoryRequestDto } from '../dto/update-repository-request.dto';
import { UpdateDataSourceRequestDto } from '../dto/update-data-source-request.dto';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';

@Injectable()
export class RepositoryFacade {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly dataSourceService: DataSourceService,
    private readonly changeHistoryService: DataSourceChangeHistoryService,
  ) {}

  // Repository Management
  async createRepository(
    createRepositoryDto: CreateRepositoryRequestDto,
    workspaceId: string,
    userId: string,
  ): Promise<Repository> {
    // Create the repository first
    const repository = await this.repositoryService.createRepository(createRepositoryDto, workspaceId);
    
    // Create data sources if provided
    if (createRepositoryDto.dataSources && createRepositoryDto.dataSources.length > 0) {
      for (const dataSourceDto of createRepositoryDto.dataSources) {
        await this.dataSourceService.createDataSource(
          repository.id,
          dataSourceDto.name,
          dataSourceDto.type,
          dataSourceDto.configuration,
          userId,
          workspaceId,
        );
      }
    }
    
    return repository;
  }

  async updateRepository(
    id: string,
    updateRepositoryDto: UpdateRepositoryRequestDto,
    userId: string,
  ): Promise<Repository> {
    return await this.repositoryService.updateRepository(id, updateRepositoryDto);
  }

  async deleteRepository(id: string, userId: string): Promise<void> {
    // Delete all associated data sources first
    await this.dataSourceService.deleteDataSourceByRepositoryId(id, userId);
    
    // Then delete the repository
    await this.repositoryService.deleteRepository(id);
  }

  async getRepositoryById(id: string): Promise<Repository> {
    return await this.repositoryService.getRepositoryById(id);
  }

  // Data Source Management (Public)
  async createDataSource(
    workspaceId: string,
    repositoryId: string,
    createDataSourceDto: { name: string; type: DataSourceType; configuration: Record<string, any> },
    userId: string,
  ): Promise<DataSource> {
    // Verify repository exists and belongs to workspace
    const repository = await this.repositoryService.getRepositoryById(repositoryId);
    if (repository.workspaceId !== workspaceId) {
      throw new NotFoundException('Repository not found in the specified workspace');
    }
    
    return await this.dataSourceService.createDataSource(
      repositoryId,
      createDataSourceDto.name,
      createDataSourceDto.type,
      createDataSourceDto.configuration,
      userId,
      workspaceId,
    );
  }

  async getDataSourcesByRepositoryId(repositoryId: string): Promise<DataSource[]> {
    // Verify repository exists
    await this.repositoryService.getRepositoryById(repositoryId);
    
    return await this.dataSourceService.getDataSourcesByRepositoryId(repositoryId);
  }

  async getDataSourceById(repositoryId: string, dataSourceId: string): Promise<DataSource> {
    // Verify repository exists
    await this.repositoryService.getRepositoryById(repositoryId);
    
    return await this.dataSourceService.getDataSourceByIdAndRepositoryId(dataSourceId, repositoryId);
  }

  async updateDataSource(
    workspaceId: string,
    repositoryId: string,
    dataSourceId: string,
    updateDataSourceDto: UpdateDataSourceRequestDto,
    userId: string,
  ): Promise<DataSource> {
    // Verify repository exists and belongs to workspace
    const repository = await this.repositoryService.getRepositoryById(repositoryId);
    if (repository.workspaceId !== workspaceId) {
      throw new NotFoundException('Repository not found in the specified workspace');
    }
    
    // Verify data source belongs to this repository
    await this.dataSourceService.getDataSourceByIdAndRepositoryId(dataSourceId, repositoryId);
    
    return await this.dataSourceService.updateDataSource(
      dataSourceId,
      updateDataSourceDto,
      userId,
      workspaceId,
    );
  }

  async getDataSourceByRepositoryId(repositoryId: string): Promise<DataSource | null> {
    return await this.dataSourceService.getDataSourceByRepositoryId(repositoryId);
  }

  async getDataSourceConfiguration(dataSourceId: string): Promise<Record<string, any> | null> {
    return await this.dataSourceService.getDecryptedConfigurationById(dataSourceId);
  }

  async deleteDataSource(
    repositoryId: string,
    dataSourceId: string,
    userId: string,
  ): Promise<void> {
    // Verify data source belongs to this repository
    await this.dataSourceService.getDataSourceByIdAndRepositoryId(dataSourceId, repositoryId);
    
    await this.dataSourceService.deleteDataSource(dataSourceId, userId);
  }

  // Change History Management
  async getDataSourceChangeHistory(
    repositoryId: string,
    dataSourceId: string,
  ): Promise<DataSourceChangeHistory[]> {
    // Verify data source belongs to this repository
    await this.dataSourceService.getDataSourceByIdAndRepositoryId(dataSourceId, repositoryId);
    
    return await this.changeHistoryService.getChangeHistoryByDataSourceId(dataSourceId);
  }

  async getDataSourceChangeHistoryPaginated(
    repositoryId: string,
    dataSourceId: string,
    skip: number,
    take: number,
  ): Promise<[DataSourceChangeHistory[], number]> {
    // Verify data source belongs to this repository
    await this.dataSourceService.getDataSourceByIdAndRepositoryId(dataSourceId, repositoryId);
    
    return await this.changeHistoryService.getChangeHistoryByDataSourceIdPaginated(
      dataSourceId,
      skip,
      take,
    );
  }
}
