import { Injectable } from '@nestjs/common';
import { AbilityBuilder, ExtractSubjectType, InferSubjects, Ability } from '@casl/ability';
import { Repository } from '../../entities/repository/repository.entity';
import { Workspace } from '../../entities/workspace/workspace.entity';
import { User } from '../../entities/user/user.entity';
import { WorkspacePermissions } from '../interfaces/workspace-permissions.interface';

// Define all subjects that can have permissions applied
type Subjects = InferSubjects<typeof Repository | typeof Workspace | typeof User> | 'all';

// Define all actions that can be performed
export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';

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
export class CaslAbilityFactory {
  createForUser(context: AbilityContext): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(Ability);

    // Workspace owners have full access to everything
    if (context.isWorkspaceOwner) {
      can('manage', 'all');
      return build({
        detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
      });
    }

    // If no permissions defined, user has no access
    if (!context.permissions) {
      return build({
        detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
      });
    }

    const { permissions } = context;

    // Workspace permissions
    if (permissions.read) {
      can('read', Workspace, { id: context.workspaceId });
    }
    if (permissions.write) {
      can('update', Workspace, { id: context.workspaceId });
    }
    if (permissions.delete) {
      can('delete', Workspace, { id: context.workspaceId });
    }

    // User permissions
    if (permissions.users?.read) {
      can('read', User);
    }
    if (permissions.users?.write) {
      can(['create', 'update'], User);
    }
    if (permissions.users?.delete) {
      can('delete', User);
    }

    // Repository permissions
    if (permissions.repository) {
      // Public repository permissions
      if (permissions.repository.read) {
        can('read', Repository, { 
          workspaceId: context.workspaceId,
          isPrivate: false 
        });
      }
      if (permissions.repository.write) {
        can(['create', 'update'], Repository, { 
          workspaceId: context.workspaceId,
          isPrivate: false 
        });
      }
      if (permissions.repository.delete) {
        can('delete', Repository, { 
          workspaceId: context.workspaceId,
          isPrivate: false 
        });
      }

      // Private repository permissions
      permissions.repository.privateRepositories?.forEach((privateRepo) => {
        const conditions = { 
          workspaceId: context.workspaceId,
          repositoryNameKey: privateRepo.repositoryKey,
          isPrivate: true 
        };

        if (privateRepo.permissions.read) {
          can('read', Repository, conditions);
        }
        if (privateRepo.permissions.write) {
          can('update', Repository, conditions);
        }
        if (privateRepo.permissions.delete) {
          can('delete', Repository, conditions);
        }
      });

      // Allow creation of repositories if user has write permission
      if (permissions.repository.write) {
        can('create', Repository, { workspaceId: context.workspaceId });
      }
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }

  // Helper method for permission checking without building full abilities
  canAccess(
    context: AbilityContext,
    action: Action,
    subject: any,
    conditions?: any
  ): boolean {
    const ability = this.createForUser(context);
    return ability.can(action, subject, conditions);
  }
}
