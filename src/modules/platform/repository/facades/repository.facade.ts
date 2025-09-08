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
    
    // Create the associated data source
    await this.createDataSourceInternal(
      repository.id,
      createRepositoryDto.dataSource.dataSourceName,
      createRepositoryDto.dataSource.dataSourceType,
      createRepositoryDto.dataSource.configuration,
      userId,
      workspaceId,
    );
    
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
    // Delete associated data source first (if exists)
    await this.dataSourceService.deleteDataSourceByRepositoryId(id, userId);
    
    // Then delete the repository
    await this.repositoryService.deleteRepository(id);
  }

  async getRepositoryById(id: string): Promise<Repository> {
    return await this.repositoryService.getRepositoryById(id);
  }

  // Data Source Management (Internal)
  private async createDataSourceInternal(
    repositoryId: string,
    name: string,
    type: DataSourceType,
    configuration: Record<string, any>,
    userId: string,
    workspaceId: string,
  ): Promise<DataSource> {
    return await this.dataSourceService.createDataSource(
      repositoryId,
      name,
      type,
      configuration,
      userId,
      workspaceId,
    );
  }

  async updateDataSource(
    repositoryId: string,
    dataSourceId: string,
    updateDataSourceDto: UpdateDataSourceRequestDto,
    userId: string,
  ): Promise<DataSource> {
    // Verify repository exists and get workspace ID
    const repository = await this.repositoryService.getRepositoryById(repositoryId);
    
    // Verify data source belongs to this repository
    const dataSource = await this.dataSourceService.getDataSourceById(dataSourceId);
    if (dataSource.repositoryId !== repositoryId) {
      throw new NotFoundException('Data source not found for this repository');
    }
    
    return await this.dataSourceService.updateDataSource(
      dataSourceId,
      updateDataSourceDto,
      userId,
      repository.workspaceId,
    );
  }

  async getDataSourceByRepositoryId(repositoryId: string): Promise<DataSource | null> {
    return await this.dataSourceService.getDataSourceByRepositoryId(repositoryId);
  }

  async getDataSourceConfiguration(repositoryId: string): Promise<Record<string, any> | null> {
    // Verify repository exists
    await this.repositoryService.getRepositoryById(repositoryId);
    
    return await this.dataSourceService.getDecryptedConfiguration(repositoryId);
  }

  async deleteDataSource(
    repositoryId: string,
    dataSourceId: string,
    userId: string,
  ): Promise<void> {
    // Verify data source belongs to this repository
    const dataSource = await this.dataSourceService.getDataSourceById(dataSourceId);
    if (dataSource.repositoryId !== repositoryId) {
      throw new NotFoundException('Data source not found for this repository');
    }
    
    await this.dataSourceService.deleteDataSource(dataSourceId, userId);
  }

  // Change History Management
  async getDataSourceChangeHistory(
    repositoryId: string,
    dataSourceId: string,
  ): Promise<DataSourceChangeHistory[]> {
    // Verify data source belongs to this repository
    const dataSource = await this.dataSourceService.getDataSourceById(dataSourceId);
    if (dataSource.repositoryId !== repositoryId) {
      throw new NotFoundException('Data source not found for this repository');
    }
    
    return await this.changeHistoryService.getChangeHistoryByDataSourceId(dataSourceId);
  }

  async getDataSourceChangeHistoryPaginated(
    repositoryId: string,
    dataSourceId: string,
    skip: number,
    take: number,
  ): Promise<[DataSourceChangeHistory[], number]> {
    // Verify data source belongs to this repository
    const dataSource = await this.dataSourceService.getDataSourceById(dataSourceId);
    if (dataSource.repositoryId !== repositoryId) {
      throw new NotFoundException('Data source not found for this repository');
    }
    
    return await this.changeHistoryService.getChangeHistoryByDataSourceIdPaginated(
      dataSourceId,
      skip,
      take,
    );
  }
}
