import { UserResponseDto } from '../../users/dto/user-response.dto';
import { GroupResponseDto } from './group-response.dto';
import { WorkspaceResponseDto } from './workspace-response.dto';

export class WorkspaceMemberResponseDto {
  id: string;
  userId: string;
  workspaceId: string;
  groupId: string;
  user: UserResponseDto;
  group: GroupResponseDto;
  workspace?: WorkspaceResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
