import { Workspace } from '../../entities/workspace/workspace.entity';
import { CreateWorkspaceRequestDto } from '../dto/create-workspace-request.dto';
import { UpdateWorkspaceRequestDto } from '../dto/update-workspace-request.dto';
import { WorkspaceResponseDto } from '../dto/workspace-response.dto';
import { EntityKeyNameHelper } from '../../shared/helpers/entity-key-name.helper';

export class WorkspaceTransformer {
  static toResponseDto(workspace: Workspace): WorkspaceResponseDto {
    const responseDto = new WorkspaceResponseDto();
    responseDto.id = workspace.id;
    responseDto.name = workspace.name;
    responseDto.name_key = workspace.nameKey; // Map nameKey to name_key for client compatibility
    responseDto.ownerUserId = workspace.ownerUserId;
    responseDto.description = workspace.description;
    responseDto.createdAt = workspace.createdAt;
    responseDto.updatedAt = workspace.updatedAt;
    return responseDto;
  }

  static toResponseDtoArray(workspaces: Workspace[]): WorkspaceResponseDto[] {
    return workspaces.map(workspace => this.toResponseDto(workspace));
  }

  static createRequestDtoToEntity(dto: CreateWorkspaceRequestDto, ownerUserId: string, nameKey: string): Partial<Workspace> {
    // Validate the provided key
    if (!EntityKeyNameHelper.isValidKey(nameKey)) {
      throw new Error(`Invalid workspace key: ${nameKey}`);
    }

    return {
      name: dto.name,
      nameKey: nameKey,
      ownerUserId: ownerUserId,
      description: dto.description,
    };
  }

  static updateRequestDtoToEntity(dto: UpdateWorkspaceRequestDto): Partial<Workspace> {
    const entityData: Partial<Workspace> = {};
    
    if (dto.name !== undefined) entityData.name = dto.name;
    if (dto.description !== undefined) entityData.description = dto.description;
    
    return entityData;
  }
}
