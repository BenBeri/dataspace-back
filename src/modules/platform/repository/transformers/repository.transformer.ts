import { Repository } from '../../entities/repository/repository.entity';
import { RepositoryResponseDto } from '../dto/repository-response.dto';
import { CreateRepositoryRequestDto } from '../dto/create-repository-request.dto';
import { UpdateRepositoryRequestDto } from '../dto/update-repository-request.dto';
import { WorkspaceTransformer } from '../../workspace/transformers/workspace.transformer';
import { DataSourceTransformer } from './data-source.transformer';
import { RepositoryKeyHelper } from '../helpers/repository-key.helper';

export class RepositoryTransformer {
  static toResponseDto(repository: Repository): RepositoryResponseDto {
    const responseDto = new RepositoryResponseDto();
    responseDto.id = repository.id;
    responseDto.name = repository.name;
    responseDto.repositoryNameKey = repository.repositoryNameKey;
    responseDto.description = repository.description;
    responseDto.workspaceId = repository.workspaceId;
    responseDto.createdAt = repository.createdAt;
    responseDto.updatedAt = repository.updatedAt;
    
    if (repository.workspace) {
      responseDto.workspace = WorkspaceTransformer.toResponseDto(repository.workspace);
    }
    
    if (repository.dataSource) {
      responseDto.dataSource = DataSourceTransformer.toResponseDto(repository.dataSource);
    }
    
    return responseDto;
  }

  static toResponseDtoArray(repositories: Repository[]): RepositoryResponseDto[] {
    return repositories.map(repository => this.toResponseDto(repository));
  }

  static createRequestDtoToEntity(
    dto: CreateRepositoryRequestDto,
    workspaceId: string,
  ): Partial<Repository> {
    // Generate repositoryNameKey from name if not provided
    const repositoryNameKey = dto.repositoryNameKey || RepositoryKeyHelper.generateKeyFromName(dto.name);
    
    // Validate the final key (whether provided or generated)
    if (!RepositoryKeyHelper.isValidKey(repositoryNameKey)) {
      throw new Error(`Invalid repository key: ${repositoryNameKey}`);
    }

    return {
      name: dto.name,
      repositoryNameKey: repositoryNameKey,
      description: dto.description,
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
    
    if (dto.repositoryNameKey !== undefined) {
      // Validate provided key
      if (!RepositoryKeyHelper.isValidKey(dto.repositoryNameKey)) {
        throw new Error(`Invalid repository key: ${dto.repositoryNameKey}`);
      }
      updates.repositoryNameKey = dto.repositoryNameKey;
    }
    
    if (dto.description !== undefined) {
      updates.description = dto.description;
    }
    
    return updates;
  }
}
