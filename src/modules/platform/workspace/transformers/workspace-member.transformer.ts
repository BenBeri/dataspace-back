import { WorkspaceMember } from '../../entities/workspace/workspace-member.entity';
import { WorkspaceMemberResponseDto } from '../dto/workspace-member-response.dto';
import { MyWorkspaceResponseDto } from '../dto/my-workspace-response.dto';
import { UserTransformer } from '../../users/transformers/user.transformer';
import { RoleTransformer } from './role.transformer';
import { WorkspaceTransformer } from './workspace.transformer';

export class WorkspaceMemberTransformer {
  static toResponseDto(workspaceMember: WorkspaceMember): WorkspaceMemberResponseDto {
    const responseDto = new WorkspaceMemberResponseDto();
    responseDto.id = workspaceMember.id;
    responseDto.userId = workspaceMember.userId;
    responseDto.workspaceId = workspaceMember.workspaceId;
    responseDto.roleId = workspaceMember.roleId;
    responseDto.createdAt = workspaceMember.createdAt;
    responseDto.updatedAt = workspaceMember.updatedAt;
    
    if (workspaceMember.user) {
      responseDto.user = UserTransformer.toResponseDto(workspaceMember.user);
    }
    
    if (workspaceMember.role) {
      responseDto.role = RoleTransformer.toResponseDto(workspaceMember.role);
    }
    
    if (workspaceMember.workspace) {
      responseDto.workspace = WorkspaceTransformer.toResponseDto(workspaceMember.workspace);
    }
    
    return responseDto;
  }

  static toResponseDtoArray(workspaceMembers: WorkspaceMember[]): WorkspaceMemberResponseDto[] {
    return workspaceMembers.map(member => this.toResponseDto(member));
  }

  static toMyWorkspaceResponseDto(workspaceMember: WorkspaceMember): MyWorkspaceResponseDto {
    if (!workspaceMember.workspace || !workspaceMember.role) {
      throw new Error('Workspace and role relations must be loaded for MyWorkspaceResponseDto');
    }

    const responseDto = new MyWorkspaceResponseDto();
    responseDto.workspaceId = workspaceMember.workspaceId;
    responseDto.nameKey = workspaceMember.workspace.name_key;
    responseDto.ownerUserId = workspaceMember.workspace.ownerUserId;
    responseDto.role = {
      name: workspaceMember.role.name,
      permissions: workspaceMember.role.permissions,
    };
    responseDto.createdAt = workspaceMember.createdAt;
    responseDto.updatedAt = workspaceMember.updatedAt;
    
    return responseDto;
  }

  static toMyWorkspaceResponseDtoArray(workspaceMembers: WorkspaceMember[]): MyWorkspaceResponseDto[] {
    return workspaceMembers.map(member => this.toMyWorkspaceResponseDto(member));
  }
}
