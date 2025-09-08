import { DataSource } from '../../entities/repository/data-source.entity';
import { DataSourceChangeHistory } from '../../entities/repository/data-source-change-history.entity';
import { DataSourceResponseDto } from '../dto/data-source-response.dto';
import { DataSourceChangeHistoryResponseDto } from '../dto/data-source-change-history-response.dto';
import { DataSourceConfigurationResponseDto } from '../dto/data-source-configuration-response.dto';

export class DataSourceTransformer {
  static toResponseDto(dataSource: DataSource): DataSourceResponseDto {
    const responseDto = new DataSourceResponseDto();
    responseDto.id = dataSource.id;
    responseDto.name = dataSource.name;
    responseDto.type = dataSource.type;
    responseDto.repositoryId = dataSource.repositoryId;
    responseDto.createdAt = dataSource.createdAt;
    responseDto.updatedAt = dataSource.updatedAt;
    
    return responseDto;
  }

  static toConfigurationResponseDto(dataSource: DataSource, configuration: Record<string, any>): DataSourceConfigurationResponseDto {
    const responseDto = new DataSourceConfigurationResponseDto();
    responseDto.id = dataSource.id;
    responseDto.name = dataSource.name;
    responseDto.type = dataSource.type;
    responseDto.configuration = configuration;
    responseDto.repositoryId = dataSource.repositoryId;
    responseDto.createdAt = dataSource.createdAt;
    responseDto.updatedAt = dataSource.updatedAt;
    
    return responseDto;
  }

  static toResponseDtoArray(dataSources: DataSource[]): DataSourceResponseDto[] {
    return dataSources.map(dataSource => this.toResponseDto(dataSource));
  }

  static changeHistoryToResponseDto(changeHistory: DataSourceChangeHistory): DataSourceChangeHistoryResponseDto {
    const responseDto = new DataSourceChangeHistoryResponseDto();
    responseDto.id = changeHistory.id;
    responseDto.dataSourceId = changeHistory.dataSourceId;
    responseDto.userId = changeHistory.userId;
    
    // Add user name if user relation is loaded
    if (changeHistory.user) {
      responseDto.userName = `${changeHistory.user.firstName} ${changeHistory.user.lastName}`;
    }
    
    responseDto.previousName = changeHistory.previousName;
    responseDto.newName = changeHistory.newName;
    responseDto.previousType = changeHistory.previousType;
    responseDto.newType = changeHistory.newType;
    responseDto.configurationChanged = changeHistory.configurationChanged;
    responseDto.changeDescription = changeHistory.changeDescription;
    responseDto.createdAt = changeHistory.createdAt;
    
    return responseDto;
  }

  static changeHistoryToResponseDtoArray(changeHistories: DataSourceChangeHistory[]): DataSourceChangeHistoryResponseDto[] {
    return changeHistories.map(changeHistory => this.changeHistoryToResponseDto(changeHistory));
  }
}
