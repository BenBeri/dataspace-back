import { Injectable } from '@nestjs/common';
import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  Ability,
} from '@casl/ability';
import { Repository } from '../../entities/repository/repository.entity';
import { Workspace } from '../../entities/workspace/workspace.entity';
import { User } from '../../entities/user/user.entity';
import { WorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';
import { WorkspaceManagementPermission } from './permissions/workspace-management-permission.enum';
import { RepositoryPermission } from './permissions/repository-permission.enum';
import { UserPermission } from './permissions/user-permission.enum';

// Define all subjects that can have permissions applied
type Subjects =
  | InferSubjects<typeof Repository | typeof Workspace | typeof User>
  | 'all';

// Define all actions that can be performed
export type Action =
  | WorkspaceManagementPermission
  | RepositoryPermission
  | UserPermission;

// Define the ability type
export type AppAbility = Ability<[Action, Subjects]>;

// Context for creating abilities
export interface AbilityContext {
  userId: string;
  workspaceId: string;
  isWorkspaceOwner: boolean;
  permissions?: WorkspacePermissions; // This is the FINAL merged permissions
  repository?: Repository; // Optional: for repository-specific checks
}

@Injectable()
export class WorkspaceAbilityFactory {
  async createForUser(context: AbilityContext): Promise<AppAbility> {
    const { can, build } = new AbilityBuilder<AppAbility>(Ability);

    // Workspace owners have full access to everything
    if (context.isWorkspaceOwner) {
      can(WorkspaceManagementPermission.MANAGE, 'all');
      return build({
        detectSubjectType: (item) =>
          item.constructor as ExtractSubjectType<Subjects>,
      });
    }

    // If no permissions defined, user has no access
    if (!context.permissions) {
      return build({
        detectSubjectType: (item) =>
          item.constructor as ExtractSubjectType<Subjects>,
      });
    }

    const { permissions } = context;

    // Workspace permissions
    if (permissions.read) {
      can(WorkspaceManagementPermission.READ, Workspace, {
        id: context.workspaceId,
      });
    }
    if (permissions.write) {
      can(WorkspaceManagementPermission.UPDATE, Workspace, {
        id: context.workspaceId,
      });
    }
    if (permissions.delete) {
      can(WorkspaceManagementPermission.DELETE, Workspace, {
        id: context.workspaceId,
      });
    }

    // Member Management permissions (renamed from users)
    if (permissions.membersManagement?.read) {
      can(UserPermission.READ, User);
    }
    if (permissions.membersManagement?.write) {
      can([UserPermission.CREATE, UserPermission.UPDATE], User);
    }
    if (permissions.membersManagement?.delete) {
      can(UserPermission.DELETE, User);
    }

    // Repository permissions - check if we're evaluating a specific repository
    if (context.repository) {
      const repo = context.repository;

      if (repo.isPrivate) {
        // For private repos, check specific repository permissions
        const privatePerms = permissions.repository?.private?.[repo.id];

        if (privatePerms?.read) {
          can(RepositoryPermission.READ, Repository, { id: repo.id });
        }
        if (privatePerms?.write) {
          can(
            [RepositoryPermission.UPDATE, RepositoryPermission.CREATE],
            Repository,
            { id: repo.id },
          );
        }
        if (privatePerms?.delete) {
          can(RepositoryPermission.DELETE, Repository, { id: repo.id });
        }
      } else {
        // For public repos, use public permissions
        const publicPerms = permissions.repository?.public;

        if (publicPerms?.read) {
          can(RepositoryPermission.READ, Repository, { id: repo.id });
        }
        if (publicPerms?.write) {
          can(
            [RepositoryPermission.UPDATE, RepositoryPermission.CREATE],
            Repository,
            { id: repo.id },
          );
        }
        if (publicPerms?.delete) {
          can(RepositoryPermission.DELETE, Repository, { id: repo.id });
        }
      }
    } else {
      // General repository permissions (for listing, creating new repos, etc.)
      if (permissions.repository?.public?.read) {
        can(RepositoryPermission.READ, Repository, {
          workspaceId: context.workspaceId,
          isPrivate: false,
        });
      }

      if (permissions.repository?.public?.write) {
        can(RepositoryPermission.CREATE, Repository, {
          workspaceId: context.workspaceId,
        });
      }

      // Add permissions for all private repos the user has access to
      const privateRepos = permissions.repository?.private || {};
      Object.entries(privateRepos).forEach(([repoId, repoPerms]) => {
        if (repoPerms.read) {
          can(RepositoryPermission.READ, Repository, { id: repoId });
        }
        if (repoPerms.write) {
          can(RepositoryPermission.UPDATE, Repository, { id: repoId });
        }
        if (repoPerms.delete) {
          can(RepositoryPermission.DELETE, Repository, { id: repoId });
        }
      });
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }

  // Helper method for permission checking without building full abilities
  async canAccess(
    context: AbilityContext,
    action: Action,
    subject: any,
    conditions?: any,
  ): Promise<boolean> {
    const ability = await this.createForUser(context);
    return ability.can(action, subject, conditions);
  }
}
