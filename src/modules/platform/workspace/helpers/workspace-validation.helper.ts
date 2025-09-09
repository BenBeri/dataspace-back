import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { Workspace } from '../../entities/workspace/workspace.entity';

export interface ValidatedWorkspaceContext {
  workspace: Workspace;
  isOwner: boolean;
}

@Injectable()
export class WorkspaceValidationHelper {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /**
   * Validate workspace existence and user ownership
   * Simple validation without caching complexity
   */
  async validateWorkspace(
    request: any,
    workspaceId: string,
    userId: string,
  ): Promise<ValidatedWorkspaceContext> {
    // Fetch workspace from database
    const workspace = await this.workspaceService.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundException(`Workspace '${workspaceId}' not found`);
    }

    // Create validation context
    const context: ValidatedWorkspaceContext = {
      workspace,
      isOwner: workspace.ownerUserId === userId,
    };

    // Set workspace in request for easy access
    request.workspace = workspace;
    request.workspaceId = workspaceId;

    return context;
  }
}
