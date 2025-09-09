import { Injectable, ForbiddenException } from '@nestjs/common';
import { WorkspaceService } from '../services/workspace.service';
import { RoleService } from '../services/role.service';
import { WorkspaceMemberService } from '../services/workspace-member.service';
import { WorkspaceMemberTransformer } from '../transformers/workspace-member.transformer';
import { AddMemberRequestDto } from '../dto/add-member-request.dto';
import { UpdateMemberRoleRequestDto } from '../dto/update-member-role-request.dto';
import { WorkspaceMemberResponseDto } from '../dto/workspace-member-response.dto';

@Injectable()
export class WorkspaceMemberFacade {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly roleService: RoleService,
    private readonly workspaceMemberService: WorkspaceMemberService,
  ) {}

  async addMemberToWorkspace(workspaceId: string, addMemberDto: AddMemberRequestDto, currentUserId: string): Promise<WorkspaceMemberResponseDto> {
    // Check if current user has permission to add members (workspace owner or admin)
    const workspace = await this.workspaceService.getWorkspaceById(workspaceId);
    if (workspace.ownerUserId !== currentUserId) {
      // Could also check if user has admin role in workspace
      const userRole = await this.workspaceMemberService.getUserRoleInWorkspace(workspaceId, currentUserId);
      if (!userRole) {
        throw new ForbiddenException('Only workspace owner or members with admin role can add members');
      }
      // Here you could check if userRole.role has permission to add members
    }

    // Get role by name
    const role = await this.roleService.getRoleByName(workspaceId, addMemberDto.roleName);
    
    // Add member to workspace
    const member = await this.workspaceMemberService.addMemberToWorkspace(workspaceId, addMemberDto.userId, role.id);
    
    // Get the member with relations for response
    const memberWithRelations = await this.workspaceMemberService.getMemberByWorkspaceAndUser(workspaceId, addMemberDto.userId);
    
    return WorkspaceMemberTransformer.toResponseDto(memberWithRelations);
  }

  async updateMemberRole(workspaceId: string, userId: string, updateMemberRoleDto: UpdateMemberRoleRequestDto, currentUserId: string): Promise<WorkspaceMemberResponseDto> {
    // Check if current user has permission to update roles (workspace owner or admin)
    const workspace = await this.workspaceService.getWorkspaceById(workspaceId);
    if (workspace.ownerUserId !== currentUserId) {
      const userRole = await this.workspaceMemberService.getUserRoleInWorkspace(workspaceId, currentUserId);
      if (!userRole) {
        throw new ForbiddenException('Only workspace owner or members with admin role can update member roles');
      }
      // Here you could check if userRole.role has permission to update roles
    }

    // Get role by name
    const role = await this.roleService.getRoleByName(workspaceId, updateMemberRoleDto.roleName);
    
    // Update member role
    const member = await this.workspaceMemberService.updateMemberRole(workspaceId, userId, role.id, currentUserId);
    
    return WorkspaceMemberTransformer.toResponseDto(member);
  }

  async removeMemberFromWorkspace(workspaceId: string, userId: string, currentUserId: string): Promise<{ message: string }> {
    // Check if current user has permission to remove members (workspace owner or admin)
    const workspace = await this.workspaceService.getWorkspaceById(workspaceId);
    if (workspace.ownerUserId !== currentUserId && userId !== currentUserId) {
      const userRole = await this.workspaceMemberService.getUserRoleInWorkspace(workspaceId, currentUserId);
      if (!userRole) {
        throw new ForbiddenException('Only workspace owner, admin members, or the user themselves can remove members');
      }
      // Here you could check if userRole.role has permission to remove members
    }

    await this.workspaceMemberService.removeMemberFromWorkspace(workspaceId, userId);
    return { message: 'Member successfully removed from workspace' };
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberResponseDto[]> {
    const members = await this.workspaceMemberService.getWorkspaceMembers(workspaceId);
    return WorkspaceMemberTransformer.toResponseDtoArray(members);
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceMemberResponseDto[]> {
    const memberships = await this.workspaceMemberService.getUserWorkspaces(userId);
    return WorkspaceMemberTransformer.toResponseDtoArray(memberships);
  }

  async checkMemberPermissions(workspaceId: string, currentUserId: string): Promise<boolean> {
    const workspace = await this.workspaceService.getWorkspaceById(workspaceId);
    
    // Workspace owner always has permissions
    if (workspace.ownerUserId === currentUserId) {
      return true;
    }

    // Check if user is a member with appropriate role
    const userRole = await this.workspaceMemberService.getUserRoleInWorkspace(workspaceId, currentUserId);
    if (!userRole) {
      return false;
    }

    // Here you could implement more granular permission checking based on role permissions
    // For now, any member has basic permissions
    return true;
  }

  async getMemberRoleInWorkspace(workspaceId: string, userId: string): Promise<WorkspaceMemberResponseDto | null> {
    const member = await this.workspaceMemberService.getUserRoleInWorkspace(workspaceId, userId);
    
    if (!member) {
      return null;
    }

    return WorkspaceMemberTransformer.toResponseDto(member);
  }
}
