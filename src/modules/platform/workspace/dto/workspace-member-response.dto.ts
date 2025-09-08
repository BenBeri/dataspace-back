import { UserResponseDto } from '../../users/dto/user-response.dto';
import { RoleResponseDto } from './role-response.dto';
import { WorkspaceResponseDto } from './workspace-response.dto';

export class WorkspaceMemberResponseDto {
  id: string;
  userId: string;
  workspaceId: string;
  roleId: string;
  user: UserResponseDto;
  role: RoleResponseDto;
  workspace?: WorkspaceResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
