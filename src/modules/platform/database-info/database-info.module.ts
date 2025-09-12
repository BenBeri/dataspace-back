import { Module } from '@nestjs/common';
import { DatabaseInfoController } from './database-info.controller';
import { DatabaseInfoProvider } from './providers/database-info.provider';
import { DatabaseInfoService } from './services/database-info.service';

/**
 * Module for database information functionality
 * Provides information about supported databases and their configurations
 */
@Module({
  controllers: [DatabaseInfoController],
  providers: [DatabaseInfoProvider, DatabaseInfoService],
  exports: [DatabaseInfoProvider, DatabaseInfoService],
})
export class DatabaseInfoModule {}
