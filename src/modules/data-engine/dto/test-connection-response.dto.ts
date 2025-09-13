import { DataSourceType } from '../../platform/entities/enums/data-source-type.enum';

/**
 * DTO for connection test response
 */
export class TestConnectionResponseDto {
  success: boolean;
  type: DataSourceType;
  message: string;
  responseTime: number; // milliseconds
  error?: string;
  serverInfo?: {
    version?: string;
    serverName?: string;
    additionalInfo?: Record<string, any>;
  };
}
