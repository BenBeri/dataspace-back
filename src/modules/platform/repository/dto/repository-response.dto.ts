import { WorkspaceResponseDto } from '../../workspace/dto/workspace-response.dto';
import { DataSourceResponseDto } from './data-source-response.dto';

export class RepositoryResponseDto {
  id: string;
  name: string;
  repositoryNameKey: string;
  description: string;
  workspaceId: string;
  workspace?: WorkspaceResponseDto;
  dataSource?: DataSourceResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
