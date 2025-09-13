import { IsString, IsNotEmpty, IsObject } from 'class-validator';
import type { WorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';

export class CreateGroupRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  permissions: WorkspacePermissions;
}
