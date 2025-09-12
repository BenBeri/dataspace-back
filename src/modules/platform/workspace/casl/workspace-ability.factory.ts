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
import { UserPrivateRepositoryService } from '../../repository/services/user-private-repository.service';

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
  permissions?: WorkspacePermissions;
}

@Injectable()
export class WorkspaceAbilityFactory {
  constructor(
    private readonly userPrivateRepositoryService: UserPrivateRepositoryService,
  ) {}

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

    // User permissions
    if (permissions.users?.read) {
      can(UserPermission.READ, User);
    }
    if (permissions.users?.write) {
      can([UserPermission.CREATE, UserPermission.UPDATE], User);
    }
    if (permissions.users?.delete) {
      can(UserPermission.DELETE, User);
    }

    // Repository permissions
    if (permissions.repository) {
      // Public repository permissions
      if (permissions.repository.read) {
        can(RepositoryPermission.READ, Repository, {
          workspaceId: context.workspaceId,
          isPrivate: false,
        });
      }
      if (permissions.repository.write) {
        can(
          [RepositoryPermission.CREATE, RepositoryPermission.UPDATE],
          Repository,
          {
            workspaceId: context.workspaceId,
            isPrivate: false,
          },
        );
      }
      if (permissions.repository.delete) {
        can(RepositoryPermission.DELETE, Repository, {
          workspaceId: context.workspaceId,
          isPrivate: false,
        });
      }

      // Private repository permissions - Mission 1: Whitelist system
      const privateRepoAccess =
        await this.userPrivateRepositoryService.getUserPrivateRepositoryAccess(
          context.userId,
          context.workspaceId,
        );

      privateRepoAccess.forEach((access) => {
        const conditions = {
          id: access.repositoryId,
          isPrivate: true,
        };

        if (access.permissions.read) {
          can(RepositoryPermission.READ, Repository, conditions);
        }
        if (access.permissions.write) {
          can(RepositoryPermission.UPDATE, Repository, conditions);
        }
        if (access.permissions.delete) {
          can(RepositoryPermission.DELETE, Repository, conditions);
        }
      });

      // Allow creation of repositories if user has write permission
      if (permissions.repository.write) {
        can(RepositoryPermission.CREATE, Repository, {
          workspaceId: context.workspaceId,
        });
      }
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
