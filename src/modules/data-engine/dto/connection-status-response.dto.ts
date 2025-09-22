import { DataSourceType } from '../../platform/entities/enums/data-source-type.enum';

/**
 * DTO for connection status response
 */
export class ConnectionStatusResponseDto {
  workspaceId: string;
  repositoryId: string;
  dataSourceId: string;
  type: DataSourceType | null;
  status: 'healthy' | 'unhealthy' | 'disconnected';
  connectedAt?: Date;
  responseTime?: number; // milliseconds
  error?: string;
}

/**
 * DTO for repository data sources response
 */
export class RepositoryDataSourcesResponseDto {
  workspaceId: string;
  repositoryId: string;
  dataSources: Array<{
    dataSourceId: string;
    name: string;
    type: DataSourceType;
    status: 'healthy' | 'unhealthy' | 'disconnected';
    connectedAt?: Date;
  }>;
}

/**
 * DTO for connection pool statistics response
 */
export class PoolStatisticsResponseDto {
  totalConnections: number;
  activeConnections: number;
  connectionsByType: Record<DataSourceType, number>;
  connectionsByWorkspace: Record<string, number>;
  timestamp: Date;
}

/**
 * DTO for native client response
 */
export class NativeClientResponseDto {
  type: DataSourceType;
  warning: string;
  // Note: The actual client object is not included in DTO for security reasons
}
