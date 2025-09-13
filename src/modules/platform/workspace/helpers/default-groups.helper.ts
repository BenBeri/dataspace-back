import { Injectable } from '@nestjs/common';
import { WorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';
import { CreateGroupDto } from '../dto/create-group.dto';

export interface DefaultGroupConfig {
  name: string;
  permissions: WorkspacePermissions;
}

@Injectable()
export class DefaultGroupsHelper {
  /**
   * Get all default groups configurations
   */
  static getDefaultGroups(): DefaultGroupConfig[] {
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
   * Get only admin group configuration
   */
  static getAdminGroup(): DefaultGroupConfig {
    return {
      name: 'admin',
      permissions: this.getAdminPermissions(),
    };
  }

  /**
   * Admin permissions - all enabled with new structure
   */
  private static getAdminPermissions(): WorkspacePermissions {
    return {
      read: true,
      write: true,
      delete: true,
      membersManagement: {
        read: true,
        write: true,
        delete: true,
      },
      repository: {
        public: {
          read: true,
          write: true,
          delete: true,
        },
        private: {
          // Admin has no specific private repo permissions by default
          // They get access through workspace ownership
        },
      },
    };
  }

  /**
   * Editor permissions - repository management focused with new structure
   */
  private static getEditorPermissions(): WorkspacePermissions {
    return {
      read: true,
      write: true,
      delete: false,
      membersManagement: {
        read: true,
        write: false,
        delete: false,
      },
      repository: {
        public: {
          read: true,
          write: true,
          delete: true,
        },
        private: {
          // No default private repo access
        },
      },
    };
  }

  /**
   * Viewer permissions - read-only access with new structure
   */
  private static getViewerPermissions(): WorkspacePermissions {
    return {
      read: true,
      write: false,
      delete: false,
      membersManagement: {
        read: true,
        write: false,
        delete: false,
      },
      repository: {
        public: {
          read: true,
          write: false,
          delete: false,
        },
        private: {
          // No default private repo access
        },
      },
    };
  }

  /**
   * Filter out admin group from custom groups list
   */
  static filterOutAdminGroup(customGroups: CreateGroupDto[]): CreateGroupDto[] {
    return customGroups.filter((group) => group.name.toLowerCase() !== 'admin');
  }

  /**
   * Validate group permissions structure
   */
  static validatePermissions(permissions: WorkspacePermissions): boolean {
    // Basic validation - ensure all required fields are present
    return !!(
      permissions &&
      typeof permissions.read === 'boolean' &&
      typeof permissions.write === 'boolean' &&
      typeof permissions.delete === 'boolean' &&
      permissions.membersManagement &&
      typeof permissions.membersManagement.read === 'boolean' &&
      typeof permissions.membersManagement.write === 'boolean' &&
      typeof permissions.membersManagement.delete === 'boolean' &&
      permissions.repository &&
      permissions.repository.public &&
      typeof permissions.repository.public.read === 'boolean' &&
      typeof permissions.repository.public.write === 'boolean' &&
      typeof permissions.repository.public.delete === 'boolean' &&
      permissions.repository.private &&
      typeof permissions.repository.private === 'object'
    );
  }
}
