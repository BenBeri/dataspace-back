import { IsString, IsOptional, IsObject } from 'class-validator';
import type { WorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';

export class UpdateGroupRequestDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  permissions?: WorkspacePermissions;
}
