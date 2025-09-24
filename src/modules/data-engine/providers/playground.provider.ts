import { Injectable, Logger } from '@nestjs/common';
import { RepositoryFacade } from '../../platform/repository/facades/repository.facade';
import { WorkspaceService } from '../../platform/workspace/services/workspace.service';
import { CreatePlaygroundRepositoryRequestDto } from '../../platform/repository/dto/create-playground-repository-request.dto';
import { RepositoryResponseDto } from '../../platform/repository/dto/repository-response.dto';
import { RepositoryTransformer } from '../../platform/repository/transformers/repository.transformer';
import { WorkspaceType } from '../../platform/entities/enums/workspace-type.enum';

@Injectable()
export class PlaygroundProvider {
  private readonly logger = new Logger(PlaygroundProvider.name);

  constructor(
    private readonly repositoryFacade: RepositoryFacade,
    private readonly workspaceService: WorkspaceService,
  ) {}

  /**
   * Create playground repository with optional credentials
   * Provider orchestration: Repository creation + credentials + metadata updates
   */
  async createPlaygroundRepository(
    createRepositoryDto: CreatePlaygroundRepositoryRequestDto,
    userId: string,
  ): Promise<RepositoryResponseDto> {
    this.logger.debug(
      `Creating playground repository for user ${userId}: ${createRepositoryDto.name}`,
    );

    // 1. Get user's playground workspace
    const playgroundWorkspace = await this.getPlaygroundWorkspace(userId);

    // 2. Create repository via facade (always private for playground)
    const repository = await this.repositoryFacade.createRepository(
      {
        name: createRepositoryDto.name,
        description: createRepositoryDto.description,
        type: createRepositoryDto.type,
        isPrivate: true, // Playground repositories are always private
      },
      playgroundWorkspace.id,
      userId,
    );

    // 3. If credentials provided, create them and mark as saved
    if (createRepositoryDto.credentials) {
      this.logger.debug(
        `Creating credentials for playground repository ${repository.id}`,
      );

      try {
        // Create credentials
        const credentials =
          await this.repositoryFacade.createRepositoryCredentials(
            repository.id,
            createRepositoryDto.credentials.name,
            createRepositoryDto.credentials.description,
            createRepositoryDto.credentials.config,
            true, // Set as default credentials
            userId,
          );

        // Create default access for the credentials (CRITICAL for playground)
        await this.repositoryFacade.createDefaultCredentialsAccess(
          credentials.id,
          userId,
          'Default access for playground repository credentials',
        );

        // Mark repository as saved since it has credentials
        await this.repositoryFacade.updateRepositoryMetadata(repository.id, {
          isSaved: true,
        });

        this.logger.debug(
          `Successfully created credentials for playground repository ${repository.id}`,
        );
      } catch (credentialsError) {
        this.logger.error(
          `Failed to create credentials for playground repository ${repository.id}: ${credentialsError.message}`,
        );
        // Note: Repository already created, user can add credentials later
      }
    }

    return RepositoryTransformer.toResponseDto(repository);
  }

  /**
   * Save credentials for existing playground repository
   * Provider orchestration: Credentials creation + metadata updates
   */
  async savePlaygroundCredentials(
    repositoryId: string,
    credentialsData: {
      name: string;
      description: string;
      config: any;
    },
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.debug(
      `Saving credentials for playground repository ${repositoryId}`,
    );

    try {
      // Validate repository belongs to user's playground workspace
      await this.validatePlaygroundRepository(repositoryId, userId);

      // Create credentials via facade
      const credentials =
        await this.repositoryFacade.createRepositoryCredentials(
          repositoryId,
          credentialsData.name,
          credentialsData.description,
          credentialsData.config,
          true, // Set as default
          userId,
        );

      // Create default access for the credentials (CRITICAL for playground)
      await this.repositoryFacade.createDefaultCredentialsAccess(
        credentials.id,
        userId,
        'Default access for playground repository credentials',
      );

      // Mark repository as saved
      await this.repositoryFacade.updateRepositoryMetadata(repositoryId, {
        isSaved: true,
      });

      return {
        success: true,
        message: 'Credentials saved successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to save credentials for playground repository ${repositoryId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Validate playground repository (public method for SSE)
   */
  async validatePlaygroundRepositoryAccess(
    repositoryId: string,
    userId: string,
  ) {
    return await this.validatePlaygroundRepository(repositoryId, userId);
  }

  /**
   * Get user's playground workspace (public method for SSE)
   */
  async getPlaygroundWorkspaceForUser(userId: string) {
    return await this.getPlaygroundWorkspace(userId);
  }

  /**
   * Get user's playground workspace
   */
  private async getPlaygroundWorkspace(userId: string) {
    const workspaces = await this.workspaceService.getWorkspacesByOwner(userId);
    const playground = workspaces.find(
      (w) => w.workspaceType === WorkspaceType.PLAYGROUND,
    );

    if (!playground) {
      throw new Error('Playground workspace not found for user');
    }

    return playground;
  }

  /**
   * Validate repository belongs to user's playground workspace
   */
  private async validatePlaygroundRepository(
    repositoryId: string,
    userId: string,
  ) {
    const playground = await this.getPlaygroundWorkspace(userId);
    const repository =
      await this.repositoryFacade.getRepositoryById(repositoryId);

    if (!repository || repository.workspaceId !== playground.id) {
      throw new Error(
        'Repository does not belong to user playground workspace',
      );
    }

    return repository;
  }
}
