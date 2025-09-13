import type { WorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';

export class UserPermissionsResponseDto {
  userId: string;
  workspaceId: string;
  groupId: string;
  groupName: string;
  finalPermissions: WorkspacePermissions;
  hasOverrides: boolean;
}
