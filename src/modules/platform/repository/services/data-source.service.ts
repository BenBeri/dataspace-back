import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { DataSource } from '../../entities/repository/data-source.entity';
import { DataSourceRepository } from '../repositories/data-source.repository';
import { DataSourceChangeHistoryService } from './data-source-change-history.service';
import type { IKeyManagementService } from '../../key-management/interfaces/key-management.interface';
import { KEY_MANAGEMENT_SERVICE } from '../../key-management/key-management.module';
import { WorkspaceService } from '../../workspace/services/workspace.service';

@Injectable()
export class DataSourceService {
  constructor(
    private readonly dataSourceRepository: DataSourceRepository,
    private readonly changeHistoryService: DataSourceChangeHistoryService,
    @Inject(KEY_MANAGEMENT_SERVICE)
    private readonly keyManagementService: IKeyManagementService,
    private readonly workspaceService: WorkspaceService,
  ) {}

  private async encryptConfiguration(
    workspaceId: string,
    configuration: Record<string, any>,
  ): Promise<string> {
    const workspace = await this.workspaceService.getWorkspaceById(workspaceId);

    if (!workspace.kmsKeyId) {
      throw new BadRequestException('Workspace encryption key not found');
    }

    const configurationJson = JSON.stringify(configuration);
    return await this.keyManagementService.encrypt(
      workspace.kmsKeyId,
      configurationJson,
    );
  }

  private async decryptConfiguration(
    encryptedConfiguration: string,
  ): Promise<Record<string, any>> {
    const decryptedJson = await this.keyManagementService.decrypt(
      encryptedConfiguration,
    );
    return JSON.parse(decryptedJson);
  }

  async getDecryptedConfiguration(
    repositoryId: string,
  ): Promise<Record<string, any> | null> {
    const dataSource =
      await this.dataSourceRepository.findByRepositoryId(repositoryId);

    if (!dataSource) {
      return null;
    }

    return await this.decryptConfiguration(dataSource.encryptedConfiguration);
  }

  async createDataSource(
    repositoryId: string,
    name: string,
    configuration: Record<string, any>,
    userId: string,
    workspaceId: string,
  ): Promise<DataSource> {
    const encryptedConfiguration = await this.encryptConfiguration(
      workspaceId,
      configuration,
    );

    const dataSourceData = {
      name,
      encryptedConfiguration,
      repositoryId,
    };

    const dataSource =
      await this.dataSourceRepository.createFromData(dataSourceData);

    // Record the creation in change history
    await this.changeHistoryService.recordChange({
      dataSourceId: dataSource.id,
      userId,
      newName: name,
      configurationChanged: true,
      changeDescription: 'Data source created',
    });

    return dataSource;
  }

  async getDataSourceById(id: string): Promise<DataSource> {
    const dataSource = await this.dataSourceRepository.findById(id);

    if (!dataSource) {
      throw new NotFoundException(`Data source with ID ${id} not found`);
    }

    return dataSource;
  }

  async getDataSourceByRepositoryId(
    repositoryId: string,
  ): Promise<DataSource | null> {
    return await this.dataSourceRepository.findByRepositoryId(repositoryId);
  }

  async getDataSourcesByRepositoryId(
    repositoryId: string,
  ): Promise<DataSource[]> {
    return await this.dataSourceRepository.findAllByRepositoryId(repositoryId);
  }

  async getDataSourceByIdAndRepositoryId(
    id: string,
    repositoryId: string,
  ): Promise<DataSource> {
    const dataSource = await this.dataSourceRepository.findByIdAndRepositoryId(
      id,
      repositoryId,
    );

    if (!dataSource) {
      throw new NotFoundException(
        `Data source with ID ${id} not found for repository ${repositoryId}`,
      );
    }

    return dataSource;
  }

  async getDecryptedConfigurationById(
    dataSourceId: string,
  ): Promise<Record<string, any> | null> {
    const dataSource = await this.dataSourceRepository.findById(dataSourceId);

    if (!dataSource) {
      return null;
    }

    return await this.decryptConfiguration(dataSource.encryptedConfiguration);
  }

  async updateDataSource(
    id: string,
    updates: {
      name?: string;
      configuration?: Record<string, any>;
    },
    userId: string,
    workspaceId: string,
  ): Promise<DataSource> {
    const dataSource = await this.getDataSourceById(id);

    // Prepare change history data
    const changeData: any = {
      dataSourceId: id,
      userId,
      changeDescription: 'Data source updated',
    };

    // Track what changed
    const changes: string[] = [];

    if (updates.name !== undefined && updates.name !== dataSource.name) {
      changeData.previousName = dataSource.name;
      changeData.newName = updates.name;
      changes.push('name');
    }

    let updatedData: any = {};

    if (updates.configuration !== undefined) {
      // Decrypt current configuration to compare
      const currentConfiguration = await this.decryptConfiguration(
        dataSource.encryptedConfiguration,
      );
      const configChanged =
        JSON.stringify(updates.configuration) !==
        JSON.stringify(currentConfiguration);
      if (configChanged) {
        const encryptedConfiguration = await this.encryptConfiguration(
          workspaceId,
          updates.configuration,
        );
        updatedData.encryptedConfiguration = encryptedConfiguration;
        changeData.configurationChanged = true;
        changes.push('configuration');
      }
    }

    if (updates.name !== undefined) {
      updatedData.name = updates.name;
    }

    // Only proceed if there are actual changes
    if (changes.length === 0) {
      return dataSource; // No changes detected
    }

    // Update the data source
    await this.dataSourceRepository.updateWithData(id, updatedData);

    // Record the change in history
    changeData.changeDescription = `Data source updated: ${changes.join(', ')}`;
    await this.changeHistoryService.recordChange(changeData);

    return await this.getDataSourceById(id);
  }

  async deleteDataSource(id: string, userId: string): Promise<void> {
    const dataSource = await this.getDataSourceById(id);

    // Delete change history first (due to foreign key constraints)
    await this.changeHistoryService.deleteByDataSourceId(id);

    // Delete the data source
    await this.dataSourceRepository.delete(id);
  }

  async deleteDataSourceByRepositoryId(
    repositoryId: string,
    userId: string,
  ): Promise<void> {
    const dataSources =
      await this.dataSourceRepository.findAllByRepositoryId(repositoryId);

    for (const dataSource of dataSources) {
      await this.deleteDataSource(dataSource.id, userId);
    }
  }
}
