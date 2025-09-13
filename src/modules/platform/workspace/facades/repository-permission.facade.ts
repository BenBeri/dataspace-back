import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WorkspaceMemberService } from '../services/workspace-member.service';
import { RepositoryService } from '../../repository/services/repository.service';
import { PermissionMergeHelper } from '../../shared/helpers/permission-merge.helper';
import { GrantRepositoryPermissionRequestDto } from '../dto/grant-repository-permission-request.dto';
import { UserPermissionsResponseDto } from '../dto/user-permissions-response.dto';
import {
  RepositoryUserAccessResponseDto,
  RepositoryUserAccessDto,
  RepositoryAccessPermissions,
} from '../dto/repository-user-access-response.dto';
import type { PartialWorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';

@Injectable()
export class RepositoryPermissionFacade {
  constructor(
    private readonly workspaceMemberService: WorkspaceMemberService,
    private readonly repositoryService: RepositoryService,
  ) {}

  async grantRepositoryAccess(
    workspaceId: string,
    repositoryId: string,
    userId: string,
    permissions: GrantRepositoryPermissionRequestDto,
  ): Promise<UserPermissionsResponseDto> {
    // Verify repository exists and is private
    const repository =
      await this.repositoryService.getRepositoryById(repositoryId);
    if (!repository || repository.workspaceId !== workspaceId) {
      throw new NotFoundException('Repository not found in this workspace');
    }

    if (!repository.isPrivate) {
      throw new BadRequestException(
        'Can only grant specific access to private repositories',
      );
    }

    // Get current member
    const member =
      await this.workspaceMemberService.getMemberByWorkspaceAndUser(
        workspaceId,
        userId,
      );
    if (!member) {
      throw new NotFoundException('User is not a member of this workspace');
    }

    // Build the permission override for this specific repository
    const repositoryPermissionOverride: PartialWorkspacePermissions = {
      repository: {
        private: {
          [repositoryId]: {
            read: permissions.read,
            write: permissions.write,
            delete: permissions.delete,
          },
        },
      },
    };

    // Merge with existing user overrides
    const existingOverrides = member.permissions || {};
    const mergedOverrides = PermissionMergeHelper.deepMergePermissions(
      existingOverrides as any,
      repositoryPermissionOverride,
    ) as PartialWorkspacePermissions;

    // Update the member's permissions
    await this.workspaceMemberService.updateMemberPermissions(
      workspaceId,
      userId,
      mergedOverrides,
    );

    // Return updated user permissions
    return this.getUserPermissions(workspaceId, userId);
  }

  async revokeRepositoryAccess(
    workspaceId: string,
    repositoryId: string,
    userId: string,
  ): Promise<UserPermissionsResponseDto> {
    // Verify repository exists
    const repository =
      await this.repositoryService.getRepositoryById(repositoryId);
    if (!repository || repository.workspaceId !== workspaceId) {
      throw new NotFoundException('Repository not found in this workspace');
    }

    // Get current member
    const member =
      await this.workspaceMemberService.getMemberByWorkspaceAndUser(
        workspaceId,
        userId,
      );
    if (!member) {
      throw new NotFoundException('User is not a member of this workspace');
    }

    // Remove the specific repository permission from user overrides
    const currentOverrides = member.permissions || {};
    if (currentOverrides.repository?.private?.[repositoryId]) {
      delete currentOverrides.repository.private[repositoryId];

      // Clean up empty objects
      if (Object.keys(currentOverrides.repository.private).length === 0) {
        delete currentOverrides.repository.private;
        if (Object.keys(currentOverrides.repository).length === 0) {
          delete currentOverrides.repository;
        }
      }
    }

    // Update the member's permissions
    await this.workspaceMemberService.updateMemberPermissions(
      workspaceId,
      userId,
      currentOverrides,
    );

    // Return updated user permissions
    return this.getUserPermissions(workspaceId, userId);
  }

  async getUserPermissions(
    workspaceId: string,
    userId: string,
  ): Promise<UserPermissionsResponseDto> {
    const memberWithGroup =
      await this.workspaceMemberService.getMemberByWorkspaceAndUser(
        workspaceId,
        userId,
      );

    if (!memberWithGroup) {
      throw new NotFoundException('User is not a member of this workspace');
    }

    // Get final permissions using the same logic as CASL helper
    const groupPermissions = memberWithGroup.group.permissions;
    const userOverrides = memberWithGroup.permissions;
    const finalPermissions = PermissionMergeHelper.deepMergePermissions(
      groupPermissions,
      userOverrides,
    );

    return {
      userId,
      workspaceId,
      groupId: memberWithGroup.groupId,
      groupName: memberWithGroup.group.name,
      finalPermissions,
      hasOverrides: !!userOverrides && Object.keys(userOverrides).length > 0,
    };
  }

  async getRepositoryUserAccess(
    workspaceId: string,
    repositoryId: string,
  ): Promise<RepositoryUserAccessResponseDto> {
    // Verify repository exists
    const repository =
      await this.repositoryService.getRepositoryById(repositoryId);
    if (!repository || repository.workspaceId !== workspaceId) {
      throw new NotFoundException('Repository not found in this workspace');
    }

    // Get all workspace members with their groups and users
    const members =
      await this.workspaceMemberService.getWorkspaceMembersWithDetails(
        workspaceId,
      );

    const usersWithAccess: RepositoryUserAccessDto[] = [];

    for (const member of members) {
      const groupPermissions = member.group.permissions;
      const userOverrides = member.permissions;
      const finalPermissions = PermissionMergeHelper.deepMergePermissions(
        groupPermissions,
        userOverrides,
      );

      let repositoryPermissions: RepositoryAccessPermissions;
      let accessSource: 'group' | 'user-override' | 'both';

      if (repository.isPrivate) {
        // For private repos, check specific repository permissions
        repositoryPermissions = finalPermissions.repository?.private?.[
          repositoryId
        ] || {
          read: false,
          write: false,
          delete: false,
        };

        // Determine access source
        const hasGroupAccess =
          !!groupPermissions.repository?.private?.[repositoryId];
        const hasUserOverride =
          !!userOverrides?.repository?.private?.[repositoryId];

        if (hasGroupAccess && hasUserOverride) {
          accessSource = 'both';
        } else if (hasUserOverride) {
          accessSource = 'user-override';
        } else if (hasGroupAccess) {
          accessSource = 'group';
        } else {
          // No access, skip this user
          continue;
        }
      } else {
        // For public repos, use public repository permissions
        repositoryPermissions = finalPermissions.repository?.public || {
          read: false,
          write: false,
          delete: false,
        };

        // Determine access source
        const hasUserOverride = !!userOverrides?.repository?.public;
        accessSource = hasUserOverride ? 'both' : 'group';
      }

      // Only include users who have at least read access
      if (
        repositoryPermissions.read ||
        repositoryPermissions.write ||
        repositoryPermissions.delete
      ) {
        usersWithAccess.push({
          userId: member.user.id,
          username: `${member.user.firstName} ${member.user.lastName}`,
          email: member.user.email,
          groupName: member.group.name,
          accessSource,
          permissions: repositoryPermissions,
        });
      }
    }

    return {
      repositoryId,
      repositoryName: repository.name,
      isPrivate: repository.isPrivate,
      usersWithAccess,
    };
  }
}
