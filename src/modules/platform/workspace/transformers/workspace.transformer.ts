import { Workspace } from '../../entities/workspace/workspace.entity';
import { CreateWorkspaceRequestDto } from '../dto/create-workspace-request.dto';
import { UpdateWorkspaceRequestDto } from '../dto/update-workspace-request.dto';
import { WorkspaceResponseDto } from '../dto/workspace-response.dto';
import { WorkspaceKeyHelper } from '../helpers/workspace-key.helper';

export class WorkspaceTransformer {
  static toResponseDto(workspace: Workspace): WorkspaceResponseDto {
    const responseDto = new WorkspaceResponseDto();
    responseDto.id = workspace.id;
    responseDto.name = workspace.name;
    responseDto.name_key = workspace.name_key;
    responseDto.ownerUserId = workspace.ownerUserId;
    responseDto.description = workspace.description;
    responseDto.createdAt = workspace.createdAt;
    responseDto.updatedAt = workspace.updatedAt;
    return responseDto;
  }

  static toResponseDtoArray(workspaces: Workspace[]): WorkspaceResponseDto[] {
    return workspaces.map(workspace => this.toResponseDto(workspace));
  }

  static createRequestDtoToEntity(dto: CreateWorkspaceRequestDto, ownerUserId: string): Partial<Workspace> {
    // Generate name_key from name if not provided
    const nameKey = dto.name_key || WorkspaceKeyHelper.generateKeyFromName(dto.name);
    
    // Validate the final key (whether provided or generated)
    if (!WorkspaceKeyHelper.isValidKey(nameKey)) {
      throw new Error(`Invalid workspace key: ${nameKey}`);
    }

    return {
      name: dto.name,
      name_key: nameKey,
      ownerUserId: ownerUserId,
      description: dto.description,
    };
  }

  static updateRequestDtoToEntity(dto: UpdateWorkspaceRequestDto): Partial<Workspace> {
    const entityData: Partial<Workspace> = {};
    
    if (dto.name !== undefined) entityData.name = dto.name;
    
    if (dto.name_key !== undefined) {
      // Validate provided key
      if (!WorkspaceKeyHelper.isValidKey(dto.name_key)) {
        throw new Error(`Invalid workspace key: ${dto.name_key}`);
      }
      entityData.name_key = dto.name_key;
    }
    
    if (dto.description !== undefined) entityData.description = dto.description;
    
    return entityData;
  }
}
