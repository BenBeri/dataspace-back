import { Injectable } from '@nestjs/common';
import { WorkspaceMemberService } from '../../workspace/services/workspace-member.service';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import {
  WorkspaceAbilityFactory,
  AbilityContext,
  Action,
} from '../../workspace/casl/workspace-ability.factory';
import { WorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';

@Injectable()
export class CaslPermissionHelper {
  constructor(
    private readonly workspaceMemberService: WorkspaceMemberService,
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceAbilityFactory: WorkspaceAbilityFactory,
  ) {}

  /**
   * Create ability context for a user in a workspace
   */
  async createAbilityContext(
    userId: string,
    workspaceId: string,
  ): Promise<AbilityContext> {
    // Check if user is the workspace owner
    const workspace = await this.workspaceService.getWorkspaceById(workspaceId);
    const isWorkspaceOwner = workspace.ownerUserId === userId;

    let permissions: WorkspacePermissions | undefined;

    if (!isWorkspaceOwner) {
      // Get user's role in the workspace
      const memberRole =
        await this.workspaceMemberService.getUserRoleInWorkspace(
          workspaceId,
          userId,
        );

      if (memberRole?.role?.permissions) {
        permissions = memberRole.role.permissions as WorkspacePermissions;
      }
    }

    return {
      userId,
      workspaceId,
      isWorkspaceOwner,
      permissions,
    };
  }

  /**
   * Check if a user can perform an action on a subject
   */
  async can(
    userId: string,
    workspaceId: string,
    action: Action,
    subject: any,
    conditions?: any,
  ): Promise<boolean> {
    const context = await this.createAbilityContext(userId, workspaceId);
    return await this.workspaceAbilityFactory.canAccess(
      context,
      action,
      subject,
      conditions,
    );
  }

  /**
   * Get the full ability for a user in a workspace
   */
  async getAbility(userId: string, workspaceId: string) {
    const context = await this.createAbilityContext(userId, workspaceId);
    return await this.workspaceAbilityFactory.createForUser(context);
  }

  /**
   * Get member role for a user in a workspace
   */
  async getMemberRole(userId: string, workspaceId: string): Promise<any> {
    return await this.workspaceMemberService.getUserRoleInWorkspace(
      workspaceId,
      userId,
    );
  }

  /**
   * Check if user is admin in workspace
   */
  async isWorkspaceAdmin(
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const memberRole = await this.getMemberRole(userId, workspaceId);
    return memberRole?.isAdmin === true;
  }

  /**
   * Check if user is admin from cached request data
   */
  isWorkspaceAdminFromRequest(request: any): boolean {
    return request.workspaceMemberRole?.isAdmin === true;
  }

  /**
   * Get ability using cached member role from request
   */
  async getAbilityFromRequest(
    request: any,
    userId: string,
    workspaceId: string,
  ) {
    // Use cached member role if available
    const memberRole = request.workspaceMemberRole;
    const isWorkspaceOwner = request.workspace?.ownerUserId === userId;

    let permissions: WorkspacePermissions | undefined;

    if (!isWorkspaceOwner && memberRole?.role?.permissions) {
      permissions = memberRole.role.permissions as WorkspacePermissions;
    }

    const context = {
      userId,
      workspaceId,
      isWorkspaceOwner,
      permissions,
    };

    return await this.workspaceAbilityFactory.createForUser(context);
  }
}
