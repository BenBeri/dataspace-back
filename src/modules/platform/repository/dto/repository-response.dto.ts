import { WorkspaceResponseDto } from '../../workspace/dto/workspace-response.dto';
import { DataSourceType } from '../../entities/enums/data-source-type.enum';

export class RepositoryResponseDto {
  id: string;
  name: string;
  repositoryNameKey: string;
  description: string;
  type: DataSourceType;
  workspaceId: string;
  workspace?: WorkspaceResponseDto;
  hasConnection: boolean;
  createdAt: Date;
  updatedAt: Date;
}
