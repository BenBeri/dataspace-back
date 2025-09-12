import { Controller, Get, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { DatabaseInfoProvider } from './providers/database-info.provider';
import { GetSupportedDatabasesQueryDto } from './dto/get-supported-databases-query.dto';
import { SupportedDatabasesResponseDto } from './dto/supported-databases-response.dto';

/**
 * Controller for database information endpoints
 * Provides information about supported databases and their configurations
 */
@Controller('database-info')
export class DatabaseInfoController {
  constructor(private readonly databaseInfoProvider: DatabaseInfoProvider) {}

  /**
   * Get all supported databases
   * @param query - Query parameters including optional includeConfig flag
   * @returns List of supported databases with optional configuration details
   */
  @Get('supported-databases')
  @HttpCode(HttpStatus.OK)
  async getSupportedDatabases(
    @Query() query: GetSupportedDatabasesQueryDto,
  ): Promise<SupportedDatabasesResponseDto> {
    return await this.databaseInfoProvider.getSupportedDatabases(query);
  }
}
