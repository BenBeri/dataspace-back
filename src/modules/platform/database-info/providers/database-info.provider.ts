import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { DatabaseInfoService } from '../services/database-info.service';
import { GetSupportedDatabasesQueryDto } from '../dto/get-supported-databases-query.dto';
import { SupportedDatabasesResponseDto } from '../dto/supported-databases-response.dto';

/**
 * Provider for orchestrating database information operations
 * Handles coordination between services and transformation to response DTOs
 */
@Injectable()
export class DatabaseInfoProvider {
  private readonly logger = new Logger(DatabaseInfoProvider.name);

  constructor(private readonly databaseInfoService: DatabaseInfoService) {}

  /**
   * Get all supported databases with optional configuration details
   */
  async getSupportedDatabases(
    query: GetSupportedDatabasesQueryDto,
  ): Promise<SupportedDatabasesResponseDto> {
    try {
      this.logger.log(
        `Getting supported databases, includeConfig: ${query.includeConfig}`,
      );

      // Get database information from service
      const databases = this.databaseInfoService.getSupportedDatabases(
        query.includeConfig,
      );

      // Transform to response DTO
      const response = plainToInstance(SupportedDatabasesResponseDto, {
        databases,
        totalCount: databases.length,
      });

      this.logger.log(`Retrieved ${databases.length} database types`);
      return response;
    } catch (error) {
      this.logger.error('Failed to get supported databases', error.stack);
      throw error;
    }
  }
}
