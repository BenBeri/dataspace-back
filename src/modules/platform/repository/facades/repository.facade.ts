import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { RepositoryService } from '../services/repository.service';
import { RepositoryConnectionHistoryService } from '../services/repository-connection-history.service';
import { RepositoryCredentialsService } from '../services/repository-credentials.service';
import { CredentialsAccessService } from '../services/credentials-access.service';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { Repository } from '../../entities/repository/repository.entity';
import { RepositoryConnectionHistory } from '../../entities/repository/repository-connection-history.entity';
import { RepositoryCredentials } from '../../entities/repository/repository-credentials.entity';
import { CredentialsAccess } from '../../entities/repository/credentials-access.entity';
import { AccessIdentityType } from '../../entities/enums/access-identity-type.enum';
import { CreateRepositoryRequestDto } from '../dto/create-repository-request.dto';
import { UpdateRepositoryRequestDto } from '../dto/update-repository-request.dto';
import type { IKeyManagementService } from '../../key-management/interfaces/key-management.interface';
import { KEY_MANAGEMENT_SERVICE } from '../../key-management/key-management.module';

@Injectable()
export class RepositoryFacade {
  constructor(
    private readonly repositoryService: RepositoryService,
    private readonly connectionHistoryService: RepositoryConnectionHistoryService,
    private readonly repositoryCredentialsService: RepositoryCredentialsService,
    private readonly credentialsAccessService: CredentialsAccessService,
    private readonly workspaceService: WorkspaceService,
    @Inject(KEY_MANAGEMENT_SERVICE)
    private readonly keyManagementService: IKeyManagementService,
  ) {}

  // Repository Management
  async createRepository(
    createRepositoryDto: CreateRepositoryRequestDto,
    workspaceId: string,
    userId: string,
  ): Promise<Repository> {
    // Create the repository first
    const repository = await this.repositoryService.createRepository(
      createRepositoryDto,
      workspaceId,
    );

    return repository;
  }

  async updateRepository(
    repositoryId: string,
    updateDto: UpdateRepositoryRequestDto,
    userId: string,
  ): Promise<Repository> {
    return await this.repositoryService.updateRepository(
      repositoryId,
      updateDto,
    );
  }

  async deleteRepository(repositoryId: string, userId: string): Promise<void> {
    await this.repositoryService.deleteRepository(repositoryId);
  }

  async getRepositoryById(repositoryId: string): Promise<Repository> {
    return await this.repositoryService.getRepositoryById(repositoryId);
  }

  async getRepositoriesByWorkspaceId(
    workspaceId: string,
    skip: number = 0,
    take: number = 10,
    search?: string,
  ): Promise<[Repository[], number]> {
    return await this.repositoryService.getRepositoriesByWorkspaceId(
      workspaceId,
      skip,
      take,
      search,
    );
  }

  async existsByIdAndWorkspaceId(
    repositoryId: string,
    workspaceId: string,
  ): Promise<boolean> {
    return await this.repositoryService.existsByIdAndWorkspaceId(
      repositoryId,
      workspaceId,
    );
  }

  async getRepositoryByIdAndWorkspaceId(
    repositoryId: string,
    workspaceId: string,
  ): Promise<Repository> {
    return await this.repositoryService.getRepositoryByIdAndWorkspaceId(
      repositoryId,
      workspaceId,
    );
  }

  // Connection History Management
  async getConnectionHistory(
    repositoryId: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[RepositoryConnectionHistory[], number]> {
    return await this.connectionHistoryService.getConnectionHistory(
      repositoryId,
      skip,
      take,
    );
  }

  // Repository Credentials Management
  async createRepositoryCredentials(
    repositoryId: string,
    name: string,
    description: string,
    configuration: Record<string, any>,
    isDefault: boolean,
    userId: string,
  ): Promise<RepositoryCredentials> {
    const repository = await this.repositoryService.getRepositoryById(repositoryId);
    
    // Encrypt the configuration
    const workspace = await this.workspaceService.getWorkspaceById(repository.workspaceId);
    const kmsKeyId = workspace.kmsKeyId;
    const configurationJson = JSON.stringify(configuration);
    const encryptedConfiguration = await this.keyManagementService.encrypt(kmsKeyId, configurationJson);

    return await this.repositoryCredentialsService.createCredentials(
      repositoryId,
      name,
      description,
      encryptedConfiguration,
      isDefault,
    );
  }

  async updateRepositoryCredentials(
    credentialsId: string,
    updates: {
      name?: string;
      description?: string;
      configuration?: Record<string, any>;
      isActive?: boolean;
    },
    userId: string,
  ): Promise<RepositoryCredentials> {
    const credentials = await this.repositoryCredentialsService.getCredentialsById(credentialsId);
    
    let encryptedConfiguration: string | undefined;
    if (updates.configuration) {
      const workspace = await this.workspaceService.getWorkspaceById(credentials.repository.workspaceId);
      const kmsKeyId = workspace.kmsKeyId;
      const configurationJson = JSON.stringify(updates.configuration);
      encryptedConfiguration = await this.keyManagementService.encrypt(kmsKeyId, configurationJson);
    }

    return await this.repositoryCredentialsService.updateCredentials(
      credentialsId,
      {
        ...updates,
        ...(encryptedConfiguration && { encryptedCredentials: encryptedConfiguration }),
      },
      userId,
    );
  }

  async setCredentialsAsDefault(
    credentialsId: string,
    userId: string,
  ): Promise<RepositoryCredentials> {
    return await this.repositoryCredentialsService.setAsDefault(credentialsId);
  }

  async deleteRepositoryCredentials(
    credentialsId: string,
    userId: string,
  ): Promise<void> {
    await this.repositoryCredentialsService.deleteCredentials(credentialsId);
  }

  async getRepositoryCredentials(
    repositoryId: string,
  ): Promise<RepositoryCredentials[]> {
    return await this.repositoryCredentialsService.getCredentialsByRepositoryId(repositoryId);
  }

  async getCredentialsById(credentialsId: string): Promise<RepositoryCredentials> {
    return await this.repositoryCredentialsService.getCredentialsById(credentialsId);
  }

  async decryptCredentialsConfiguration(
    encryptedCredentials: string,
  ): Promise<Record<string, any>> {
    const decryptedJson = await this.keyManagementService.decrypt(encryptedCredentials);
    return JSON.parse(decryptedJson);
  }

  // Credentials Access Management
  async grantUserAccessToCredentials(
    credentialsId: string,
    userId: string,
    grantedBy: string,
    notes?: string,
  ): Promise<CredentialsAccess> {
    return await this.credentialsAccessService.grantUserAccess(
      credentialsId,
      userId,
      grantedBy,
      notes,
    );
  }

  async grantGroupAccessToCredentials(
    credentialsId: string,
    groupId: string,
    grantedBy: string,
    notes?: string,
  ): Promise<CredentialsAccess> {
    return await this.credentialsAccessService.grantGroupAccess(
      credentialsId,
      groupId,
      grantedBy,
      notes,
    );
  }

  async createDefaultCredentialsAccess(
    credentialsId: string,
    grantedBy: string,
    notes?: string,
  ): Promise<CredentialsAccess> {
    return await this.credentialsAccessService.createDefaultAccess(
      credentialsId,
      grantedBy,
      notes,
    );
  }

  async getCredentialsAccessList(
    credentialsId: string,
  ): Promise<CredentialsAccess[]> {
    return await this.credentialsAccessService.getAccessByCredentials(credentialsId);
  }

  async revokeUserAccessToCredentials(
    credentialsId: string,
    userId: string,
  ): Promise<void> {
    await this.credentialsAccessService.revokeUserAccess(credentialsId, userId);
  }

  async revokeGroupAccessToCredentials(
    credentialsId: string,
    groupId: string,
  ): Promise<void> {
    await this.credentialsAccessService.revokeGroupAccess(credentialsId, groupId);
  }

  async getAvailableCredentialsForUser(
    repositoryId: string,
    userId: string,
    userGroupIds: string[],
  ): Promise<{
    repositoryId: string;
    availableCredentials: Array<{
      credentials: {
        id: string;
        name: string;
        description: string;
        isDefault: boolean;
        isActive: boolean;
      };
      accessType: 'user' | 'group' | 'default';
      accessDetails: {
        identityId: string;
        identityType: AccessIdentityType;
        grantedBy?: string;
        notes?: string;
      };
    }>;
  }> {
    return await this.credentialsAccessService.getAvailableCredentialsForUser(
      repositoryId,
      userId,
      userGroupIds,
    );
  }
}