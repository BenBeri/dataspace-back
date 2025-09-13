import { Injectable } from '@nestjs/common';
import { GroupService } from '../services/group.service';
import { GroupTransformer } from '../transformers/group.transformer';
import { CreateGroupRequestDto } from '../dto/create-group-request.dto';
import { UpdateGroupRequestDto } from '../dto/update-group-request.dto';
import { GroupResponseDto } from '../dto/group-response.dto';
import { CreateGroupDto } from '../dto/create-group.dto';

@Injectable()
export class GroupProvider {
  constructor(private readonly groupService: GroupService) {}

  /**
   * Create a group within a workspace
   */
  async createGroup(
    workspaceId: string,
    createGroupDto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    const group = await this.groupService.createGroup(
      workspaceId,
      createGroupDto.name,
      createGroupDto.permissions,
    );
    return GroupTransformer.toResponseDto(group);
  }

  /**
   * Get group by ID
   */
  async getGroupById(id: string): Promise<GroupResponseDto> {
    const group = await this.groupService.getGroupById(id);
    return GroupTransformer.toResponseDto(group);
  }

  /**
   * Get groups for a workspace
   */
  async getWorkspaceGroups(workspaceId: string): Promise<GroupResponseDto[]> {
    const groups = await this.groupService.getWorkspaceGroups(workspaceId);
    return GroupTransformer.toResponseDtoArray(groups);
  }

  /**
   * Update group permissions
   */
  async updateGroupPermissions(
    groupId: string,
    permissions: any,
    currentUserId: string,
  ): Promise<GroupResponseDto> {
    const group = await this.groupService.updateGroupPermissions(
      groupId,
      permissions,
      currentUserId,
    );
    return GroupTransformer.toResponseDto(group);
  }

  /**
   * Update group name
   */
  async updateGroupName(
    groupId: string,
    newName: string,
    currentUserId: string,
  ): Promise<GroupResponseDto> {
    const group = await this.groupService.updateGroupName(
      groupId,
      newName,
      currentUserId,
    );
    return GroupTransformer.toResponseDto(group);
  }

  /**
   * Delete group
   */
  async deleteGroup(groupId: string, currentUserId: string): Promise<void> {
    await this.groupService.deleteGroup(groupId, currentUserId);
  }
}
