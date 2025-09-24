import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslPermissionHelper } from '../helpers/casl-permission.helper';
import { WorkspaceValidationHelper } from '../helpers/workspace-validation.helper';
import {
  CHECK_ABILITY_KEY,
  RequiredRule,
  AbilityCheck,
} from '../casl/decorators/check-ability.decorator';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    protected reflector: Reflector,
    protected caslPermissionHelper: CaslPermissionHelper,
    protected workspaceValidationHelper: WorkspaceValidationHelper,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get user session
    const userSession = response.userSession || request.user;
    if (!userSession) {
      throw new ForbiddenException('Authentication required');
    }

    // Extract workspace ID
    const workspaceId = this.extractWorkspaceId(request);
    if (!workspaceId) {
      throw new BadRequestException(
        'Workspace context is required for permission check',
      );
    }

    // If request.repository exists, RepositoryGuard already validated workspace
    // Otherwise, validate workspace existence for workspace-only operations
    if (!request.repository) {
      await this.workspaceValidationHelper.validateWorkspace(
        request,
        workspaceId,
        userSession.userId,
      );
    }

    // Load member role for admin check and CASL evaluation (if not already loaded)
    await this.loadMemberRole(request, userSession.userId, workspaceId);

    // Check if user is workspace owner or admin - if so, allow all access
    const isOwnerOrAdmin = await this.checkOwnerOrAdmin(
      request,
      userSession.userId,
      workspaceId,
    );
    if (isOwnerOrAdmin) {
      return true; // Skip all permission checks for owners and admins
    }

    // Get required abilities from decorator metadata
    const abilityCheck = this.reflector.getAllAndOverride<
      AbilityCheck | RequiredRule[]
    >(CHECK_ABILITY_KEY, [context.getHandler(), context.getClass()]);

    // If no ability decorator is used, allow access
    if (!abilityCheck) {
      return true;
    }

    // Normalize the ability check (support legacy array format)
    const check: AbilityCheck = Array.isArray(abilityCheck)
      ? { rules: abilityCheck, operator: 'AND' }
      : abilityCheck;

    if (!check.rules || check.rules.length === 0) {
      return true;
    }

    // Get user's ability in this workspace (using cached member role)
    const ability = await this.caslPermissionHelper.getAbilityFromRequest(
      request,
      userSession.userId,
      workspaceId,
    );

    // Check abilities based on operator
    if (check.operator === 'OR') {
      // ANY rule can pass (OR logic)
      let hasAnyPermission = false;
      const failedRules: string[] = [];

      for (const rule of check.rules) {
        const subject = await this.getSubject(rule, request);

        if (ability.can(rule.action, subject)) {
          hasAnyPermission = true;
          break; // Found one valid permission, that's enough
        } else {
          failedRules.push(
            `${rule.action} ${rule.subject.name || rule.subject}`,
          );
        }
      }

      if (!hasAnyPermission) {
        throw new ForbiddenException(
          `You need at least one of the following permissions: ${failedRules.join(', ')}`,
        );
      }
    } else {
      // ALL rules must pass (AND logic - default)
      for (const rule of check.rules) {
        const subject = await this.getSubject(rule, request);

        if (!ability.can(rule.action, subject)) {
          throw new ForbiddenException(
            `You don't have permission to ${rule.action} ${rule.subject.name || rule.subject}`,
          );
        }
      }
    }

    return true;
  }

  protected extractWorkspaceId(request: any): string | null {
    // First check if it was already set by another guard/middleware
    if (request.workspaceId) {
      return request.workspaceId;
    }

    // Try to extract from various sources

    // 1. From route params (e.g., /workspaces/:workspaceId/...)
    if (request.params?.workspaceId) {
      return request.params.workspaceId;
    }

    // 2. From route params with different naming
    if (request.params?.id && request.route?.path?.includes('/workspaces/')) {
      return request.params.id;
    }

    // 3. From request body (for POST/PATCH requests)
    if (request.body?.workspaceId) {
      return request.body.workspaceId;
    }

    // 4. From query parameters
    if (request.query?.workspaceId) {
      return request.query.workspaceId;
    }

    return null;
  }

  private async getSubject(rule: RequiredRule, request: any): Promise<any> {
    // For simple string subjects, return as-is
    if (typeof rule.subject === 'string') {
      return rule.subject;
    }

    // For class constructors, create instance with request data
    if (typeof rule.subject === 'function') {
      const SubjectClass = rule.subject;

      // Create subject instance with relevant data from request
      const subjectData: any = {};

      // Add workspace ID
      const workspaceId = this.extractWorkspaceId(request);
      if (workspaceId) {
        subjectData.workspaceId = workspaceId;
      }

      // Add repository-specific data if applicable
      if (SubjectClass.name === 'Repository') {
        const repositoryId = request.params?.repositoryId || request.params?.id;
        if (repositoryId) {
          subjectData.id = repositoryId;
        }

        // Set isPrivate and repositoryNameKey if available (will be set by repository-specific guards)
        if (request.repository) {
          subjectData.isPrivate = request.repository.isPrivate;
          subjectData.repositoryNameKey = request.repository.repositoryNameKey;
        }
      }

      return new SubjectClass(subjectData);
    }

    return rule.subject;
  }

  /**
   * Load workspace member role and cache it in request
   * This avoids duplicate database queries within the same request
   */
  protected async loadMemberRole(
    request: any,
    userId: string,
    workspaceId: string,
  ): Promise<any> {
    // Check if member role is already loaded and cached
    if (request.workspaceMemberRole !== undefined) {
      return request.workspaceMemberRole;
    }

    try {
      // Load member role from database
      const memberRole = await this.caslPermissionHelper.getMemberRole(
        userId,
        workspaceId,
      );

      // Cache in request (null if user is not a member)
      request.workspaceMemberRole = memberRole;

      return memberRole;
    } catch (error) {
      // Cache null result to avoid repeated failed queries
      request.workspaceMemberRole = null;
      return null;
    }
  }

  /**
   * Check if user is workspace owner or admin
   */
  private async checkOwnerOrAdmin(
    request: any,
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    try {
      // Check if user is workspace owner first (from workspace context)
      if (request.workspace?.ownerUserId === userId) {
        return true;
      }

      // Load member role (with caching)
      const memberRole = await this.loadMemberRole(
        request,
        userId,
        workspaceId,
      );

      // Check if user is admin
      return memberRole?.isAdmin === true;
    } catch (error) {
      // If there's an error, user is not admin/owner
      return false;
    }
  }
}
