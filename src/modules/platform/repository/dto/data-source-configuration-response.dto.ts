export class DataSourceConfigurationResponseDto {
  id: string;
  name: string;
  configuration: Record<string, any>;
  repositoryId: string;
  createdAt: Date;
  updatedAt: Date;
}
