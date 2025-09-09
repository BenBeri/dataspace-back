import { Injectable } from '@nestjs/common';
import { WorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';
import { CreateRoleDto } from '../dto/create-role.dto';

export interface DefaultRoleConfig {
  name: string;
  permissions: WorkspacePermissions;
}

@Injectable()
export class DefaultRolesHelper {
  /**
   * Get all default roles configurations
   */
  static getDefaultRoles(): DefaultRoleConfig[] {
    return [
      {
        name: 'admin',
        permissions: this.getAdminPermissions(),
      },
      {
        name: 'editor',
        permissions: this.getEditorPermissions(),
      },
      {
        name: 'viewer',
        permissions: this.getViewerPermissions(),
      },
    ];
  }

  /**
   * Get only admin role configuration
   */
  static getAdminRole(): DefaultRoleConfig {
    return {
      name: 'admin',
      permissions: this.getAdminPermissions(),
    };
  }

  /**
   * Admin permissions - all enabled
   */
  private static getAdminPermissions(): WorkspacePermissions {
    return {
      read: true,
      write: true,
      delete: true,
      users: {
        read: true,
        write: true,
        delete: true,
      },
      repository: {
        read: true,
        write: true,
        delete: true,
        privateRepositories: [],
      },
    };
  }

  /**
   * Editor permissions - repository management focused
   */
  private static getEditorPermissions(): WorkspacePermissions {
    return {
      read: true,
      write: false,
      delete: false,
      users: {
        read: false,
        write: false,
        delete: false,
      },
      repository: {
        read: true,
        write: true,
        delete: true,
        privateRepositories: [],
      },
    };
  }

  /**
   * Viewer permissions - read-only access
   */
  private static getViewerPermissions(): WorkspacePermissions {
    return {
      read: true,
      write: false,
      delete: false,
      users: {
        read: false,
        write: false,
        delete: false,
      },
      repository: {
        read: true,
        write: false,
        delete: false,
        privateRepositories: [],
      },
    };
  }

  /**
   * Filter out admin role from custom roles array to avoid duplication
   */
  static filterOutAdminRole(roles: CreateRoleDto[]): CreateRoleDto[] {
    return roles.filter(role => role.name.toLowerCase() !== 'admin');
  }

  /**
   * Check if a role name is a default role
   */
  static isDefaultRole(roleName: string): boolean {
    const defaultRoleNames = ['admin', 'editor', 'viewer'];
    return defaultRoleNames.includes(roleName.toLowerCase());
  }
}
