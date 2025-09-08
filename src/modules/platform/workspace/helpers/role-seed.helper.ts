import { Injectable } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { WorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';

@Injectable()
export class RoleSeedHelper {
  constructor(private readonly roleService: RoleService) {}

  /**
   * Seed default roles if they don't exist
   */
  async seedDefaultRoles(): Promise<void> {
    await this.ensureRole('admin', this.createAdminPermissions());
    await this.ensureRole('member', this.createDefaultPermissions());
    await this.ensureRole('viewer', this.createViewerPermissions());
  }

  /**
   * Ensure a role exists, create if it doesn't
   */
  private async ensureRole(
    name: string,
    permissions: WorkspacePermissions,
  ): Promise<void> {
    try {
      await this.roleService.getRoleByName(name);
    } catch (error) {
      // Role doesn't exist, create it
      await this.roleService.createRole(name, permissions);
      console.log(`Created role: ${name}`);
    }
  }

  /**
   * Create admin permissions (all permissions enabled)
   */
  private createAdminPermissions(): WorkspacePermissions {
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
   * Create default member permissions
   */
  private createDefaultPermissions(): WorkspacePermissions {
    return {
      read: true,
      write: false,
      delete: false,
      users: {
        read: true,
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
   * Create viewer permissions (read-only access)
   */
  private createViewerPermissions(): WorkspacePermissions {
    return {
      read: true,
      write: false,
      delete: false,
      users: {
        read: true,
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
}
