import { Repository } from '../../entities/repository/repository.entity';
import { RepositoryResponseDto } from '../dto/repository-response.dto';
import { CreateRepositoryRequestDto } from '../dto/create-repository-request.dto';
import { UpdateRepositoryRequestDto } from '../dto/update-repository-request.dto';
import { WorkspaceTransformer } from '../../workspace/transformers/workspace.transformer';
import { EntityKeyNameHelper } from '../../shared/helpers/entity-key-name.helper';

export class RepositoryTransformer {
  static toResponseDto(repository: Repository): RepositoryResponseDto {
    const responseDto = new RepositoryResponseDto();
    responseDto.id = repository.id;
    responseDto.name = repository.name;
    responseDto.repositoryNameKey = repository.nameKey; // Map nameKey to repositoryNameKey for client compatibility
    responseDto.description = repository.description;
    responseDto.type = repository.type;
    responseDto.workspaceId = repository.workspaceId;
    responseDto.createdAt = repository.createdAt;
    responseDto.updatedAt = repository.updatedAt;

    if (repository.workspace) {
      responseDto.workspace = WorkspaceTransformer.toResponseDto(
        repository.workspace,
      );
    }

    // Add connection information based on credentials availability
    responseDto.hasConnection =
      repository.credentials && repository.credentials.length > 0;

    // Add metadata information
    responseDto.isPrivate = repository.isPrivate;
    responseDto.isSaved = repository.isSaved;

    return responseDto;
  }

  static toResponseDtoArray(
    repositories: Repository[],
  ): RepositoryResponseDto[] {
    return repositories.map((repository) => this.toResponseDto(repository));
  }

  static createRequestDtoToEntity(
    dto: CreateRepositoryRequestDto,
    workspaceId: string,
    nameKey: string,
  ): Partial<Repository> {
    // Validate the provided unique key
    if (!EntityKeyNameHelper.isValidKey(nameKey)) {
      throw new Error(`Invalid repository key: ${nameKey}`);
    }

    return {
      name: dto.name,
      nameKey: nameKey,
      description: dto.description,
      type: dto.type,
      workspaceId: workspaceId,
    };
  }

  static updateRequestDtoToEntity(
    dto: UpdateRepositoryRequestDto,
  ): Partial<Repository> {
    const updates: Partial<Repository> = {};

    if (dto.name !== undefined) {
      updates.name = dto.name;
    }

    // Note: nameKey is not updatable - it's set automatically during creation

    if (dto.description !== undefined) {
      updates.description = dto.description;
    }

    if (dto.type !== undefined) {
      updates.type = dto.type;
    }

    return updates;
  }
}
