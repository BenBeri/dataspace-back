import { WorkspaceMember } from '../../entities/workspace/workspace-member.entity';
import { WorkspaceMemberResponseDto } from '../dto/workspace-member-response.dto';
import { MyWorkspaceResponseDto } from '../dto/my-workspace-response.dto';
import { UserTransformer } from '../../users/transformers/user.transformer';
import { GroupTransformer } from './group.transformer';
import { WorkspaceTransformer } from './workspace.transformer';

export class WorkspaceMemberTransformer {
  static toResponseDto(
    workspaceMember: WorkspaceMember,
  ): WorkspaceMemberResponseDto {
    const responseDto = new WorkspaceMemberResponseDto();
    responseDto.id = workspaceMember.id;
    responseDto.userId = workspaceMember.userId;
    responseDto.workspaceId = workspaceMember.workspaceId;
    responseDto.groupId = workspaceMember.groupId;
    responseDto.createdAt = workspaceMember.createdAt;
    responseDto.updatedAt = workspaceMember.updatedAt;

    if (workspaceMember.user) {
      responseDto.user = UserTransformer.toResponseDto(workspaceMember.user);
    }

    if (workspaceMember.group) {
      responseDto.group = GroupTransformer.toResponseDto(workspaceMember.group);
    }

    if (workspaceMember.workspace) {
      responseDto.workspace = WorkspaceTransformer.toResponseDto(
        workspaceMember.workspace,
      );
    }

    return responseDto;
  }

  static toResponseDtoArray(
    workspaceMembers: WorkspaceMember[],
  ): WorkspaceMemberResponseDto[] {
    return workspaceMembers.map((member) => this.toResponseDto(member));
  }

  static toMyWorkspaceResponseDto(
    workspaceMember: WorkspaceMember,
  ): MyWorkspaceResponseDto {
    if (!workspaceMember.workspace || !workspaceMember.group) {
      throw new Error(
        'Workspace and group relations must be loaded for MyWorkspaceResponseDto',
      );
    }

    const responseDto = new MyWorkspaceResponseDto();
    responseDto.workspaceId = workspaceMember.workspaceId;
    responseDto.nameKey = workspaceMember.workspace.nameKey;
    responseDto.ownerUserId = workspaceMember.workspace.ownerUserId;
    responseDto.group = {
      name: workspaceMember.group.name,
      permissions: workspaceMember.group.permissions,
    };
    responseDto.createdAt = workspaceMember.createdAt;
    responseDto.updatedAt = workspaceMember.updatedAt;

    return responseDto;
  }

  static toMyWorkspaceResponseDtoArray(
    workspaceMembers: WorkspaceMember[],
  ): MyWorkspaceResponseDto[] {
    return workspaceMembers.map((member) =>
      this.toMyWorkspaceResponseDto(member),
    );
  }
}
