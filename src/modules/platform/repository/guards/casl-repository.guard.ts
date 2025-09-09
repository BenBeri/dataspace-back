import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslPermissionHelper } from '../../workspace/helpers/casl-permission.helper';
import { WorkspaceValidationHelper } from '../../workspace/helpers/workspace-validation.helper';
import { RepositoryService } from '../services/repository.service';
import { WorkspaceGuard } from '../../workspace/guards/workspace.guard';

@Injectable()
export class CaslRepositoryGuard extends WorkspaceGuard implements CanActivate {
  constructor(
    reflector: Reflector,
    caslPermissionHelper: CaslPermissionHelper,
    workspaceValidationHelper: WorkspaceValidationHelper,
    private readonly repositoryService: RepositoryService,
  ) {
    super(reflector, caslPermissionHelper, workspaceValidationHelper);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract workspace and repository IDs
    const workspaceId = this.extractWorkspaceId(request);
    const repositoryId = this.extractRepositoryId(request);

    if (!workspaceId) {
      throw new BadRequestException('Workspace context is required for repository permission check');
    }

    if (!repositoryId) {
      throw new BadRequestException('Repository ID is required when using CaslRepositoryGuard');
    }

    // Get repository details and attach to request for CASL evaluation
    const repository = await this.repositoryService.getRepositoryByIdAndWorkspaceId(
      repositoryId,
      workspaceId,
    );

    if (!repository) {
      throw new NotFoundException(`Repository '${repositoryId}' not found in this workspace`);
    }

    // Attach repository to request for CASL subject evaluation
    request.repository = repository;

    // Delegate to parent CASL guard
    return super.canActivate(context);
  }

  private extractRepositoryId(request: any): string | null {
    // First check if it was already set by another guard/middleware
    if (request.repositoryId) {
      return request.repositoryId;
    }

    // Try to extract from various sources in order of priority
    
    // 1. From route params (e.g., /repositories/:repositoryId/...)
    if (request.params?.repositoryId) {
      return request.params.repositoryId;
    }

    // 2. From route params with different naming (e.g., /repositories/:id)
    // Only use :id if the route path contains '/repositories/' to avoid conflicts
    if (request.params?.id && request.route?.path?.includes('/repositories/')) {
      return request.params.id;
    }

    // 3. From request body (for POST/PATCH requests)
    if (request.body?.repositoryId) {
      return request.body.repositoryId;
    }

    // 4. From query parameters (lowest priority)
    if (request.query?.repositoryId) {
      return request.query.repositoryId;
    }

    // Return null if no repository ID found
    return null;
  }
}
