/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { DataEngineProvider } from './providers/data-engine.provider';
import {
  ExecuteQueryRequestDto,
  ExecuteBatchQueriesRequestDto,
} from './dto/execute-query-request.dto';
import {
  QueryResultResponseDto,
  BatchQueryResultResponseDto,
  TransactionResultResponseDto,
} from './dto/query-result-response.dto';
import {
  ConnectionStatusResponseDto,
  RepositoryConnectionInfoResponseDto,
  PoolStatisticsResponseDto,
} from './dto/connection-status-response.dto';
import {
  TestConnectionRequestDto,
  TestEncryptedConnectionRequestDto,
} from './dto/test-connection-request.dto';
import { TestConnectionResponseDto } from './dto/test-connection-response.dto';
import { CurrentUser } from '../platform/auth/decorators/current-user.decorator';
import { UserSession } from '../platform/auth/models/user-session.model';
import { CheckAbility } from '../platform/workspace/casl/decorators/check-ability.decorator';
import { RepositoryGuard } from '../platform/repository/guards/repository.guard';
import { WorkspaceGuard } from '../platform/workspace/guards/workspace.guard';
import { RepositoryPermission } from '../platform/workspace/casl/permissions/repository-permission.enum';
import { WorkspaceManagementPermission } from '../platform/workspace/casl/permissions/workspace-management-permission.enum';

/**
 * Standalone Connection Testing Controller
 * Provides REST API endpoints for testing database connections without workspace/repository context
 * Used for validating credentials before saving to datasource
 */
@Controller('data-engine/test-connection')
export class ConnectionTestController {
  private readonly logger = new Logger(ConnectionTestController.name);

  constructor(private readonly dataEngineProvider: DataEngineProvider) {}

  /**
   * Test database connection with just credentials
   * No workspace or repository context required - just validates the connection
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async testConnection(
    @Body() testRequest: TestConnectionRequestDto,
    @CurrentUser() _user: UserSession,
  ): Promise<TestConnectionResponseDto> {
    this.logger.debug(
      `Testing standalone connection for type:${testRequest.type}`,
    );

    const result = await this.dataEngineProvider.testConnectionDirect(
      testRequest.type,
      testRequest.config,
      testRequest.timeoutMs,
    );

    return {
      success: result.success,
      type: result.type,
      message: result.message,
      responseTime: result.responseTime,
      error: result.error,
      serverInfo: result.serverInfo,
    };
  }

  /**
   * Test database connection using encrypted credentials from request body
   * Decrypts credentials using workspace KMS key and tests connection
   * Requires workspace context for KMS key access
   */
  @Post('encrypted/:workspaceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WorkspaceGuard)
  async testEncryptedConnection(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() testRequest: TestEncryptedConnectionRequestDto,
    @CurrentUser() _user: UserSession,
  ): Promise<TestConnectionResponseDto> {
    this.logger.debug(
      `Testing encrypted connection for workspace:${workspaceId}, type:${testRequest.type}`,
    );

    const result =
      await this.dataEngineProvider.testConnectionWithEncryptedConfig(
        workspaceId,
        testRequest.type,
        testRequest.encryptedConfig,
        testRequest.timeoutMs,
      );

    return {
      success: result.success,
      type: result.type,
      message: result.message,
      responseTime: result.responseTime,
      error: result.error,
      serverInfo: result.serverInfo,
    };
  }
}

/**
 * Data Engine Controller
 * Provides REST API endpoints for multi-database query execution on repositories
 * Follows project convention: Controller → Provider → Service → Repository
 */
@Controller('workspaces/:workspaceId/repositories/:repositoryId')
@UseGuards(WorkspaceGuard, RepositoryGuard)
export class DataEngineController {
  private readonly logger = new Logger(DataEngineController.name);

  constructor(private readonly dataEngineProvider: DataEngineProvider) {}

  /**
   * Execute a single query on a repository's database connection
   */
  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @CheckAbility({ action: RepositoryPermission.READ, subject: 'Repository' })
  async executeQuery(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Body() queryRequest: ExecuteQueryRequestDto,
    @CurrentUser() user: UserSession,
  ): Promise<QueryResultResponseDto> {
    const result = await this.dataEngineProvider.executeQuery(
      workspaceId,
      repositoryId,
      user.userId,
      queryRequest.query,
      queryRequest.params,
    );

    return {
      success: result.success,
      data: result.data,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
      type: result.type,
    };
  }

  /**
   * Execute multiple queries in batch on a repository's database connection
   */
  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @CheckAbility({ action: RepositoryPermission.READ, subject: 'Repository' })
  async executeBatchQueries(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Body() batchRequest: ExecuteBatchQueriesRequestDto,
    @CurrentUser() user: UserSession,
  ): Promise<BatchQueryResultResponseDto> {
    const result = await this.dataEngineProvider.executeBatchQueries(
      workspaceId,
      repositoryId,
      user.userId,
      batchRequest.queries,
    );

    return {
      success: result.success,
      results: result.results,
      totalExecutionTime: result.totalExecutionTime,
      type: result.type,
      queryCount: batchRequest.queries.length,
    };
  }

  /**
   * Execute operations within a database transaction
   * Note: This endpoint requires specific transaction operation implementation
   */
  @Post('transaction')
  @HttpCode(HttpStatus.OK)
  @CheckAbility({ action: RepositoryPermission.UPDATE, subject: 'Repository' })
  executeTransaction(
    @Param('workspaceId', ParseUUIDPipe) _workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) _repositoryId: string,
    @Body() _transactionRequest: { operations: any[] },
    @CurrentUser() _user: UserSession,
  ): Promise<TransactionResultResponseDto> {
    // Transaction operations need specific implementation based on use case
    // This endpoint is reserved for future transaction functionality
    throw new Error(
      'Transaction endpoint implementation pending - requires specific use case implementation',
    );
  }

  /**
   * Test database connection using existing Repository connection configuration
   * Retrieves and decrypts credentials from Repository, then tests connection
   * Requires repository read permissions
   */
  @Post('test-connection')
  @HttpCode(HttpStatus.OK)
  @CheckAbility({ action: RepositoryPermission.READ, subject: 'Repository' })
  async testRepositoryConnection(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Body() testRequest: { timeoutMs?: number },
    @CurrentUser() user: UserSession,
  ): Promise<TestConnectionResponseDto> {
    this.logger.debug(
      `Testing Repository connection for repository:${repositoryId}`,
    );

    // TODO: This method needs to be updated to use user-specific credentials
    // For now, keeping the old method until testConnectionFromRepository is updated
    const result = await this.dataEngineProvider.testConnectionFromRepository(
      workspaceId,
      repositoryId,
      testRequest.timeoutMs,
    );

    return {
      success: result.success,
      type: result.type,
      message: result.message,
      responseTime: result.responseTime,
      error: result.error,
      serverInfo: result.serverInfo,
    };
  }

  /**
   * Get connection status for a repository
   */
  @Get('status')
  @HttpCode(HttpStatus.OK)
  @CheckAbility({ action: RepositoryPermission.READ, subject: 'Repository' })
  async getConnectionStatus(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @CurrentUser() user: UserSession,
  ): Promise<ConnectionStatusResponseDto> {
    return await this.dataEngineProvider.getConnectionStatus(
      workspaceId,
      repositoryId,
      user.userId,
    );
  }

  /**
   * Get repository connection information
   */
  @Get('connection-info')
  @HttpCode(HttpStatus.OK)
  @CheckAbility({ action: RepositoryPermission.READ, subject: 'Repository' })
  async getRepositoryConnectionInfo(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @CurrentUser() user: UserSession,
  ): Promise<{
    repositoryId: string;
    credentialsName: string | null;
    type: string;
    status: string;
    connectedAt?: Date;
  }> {
    const result = await this.dataEngineProvider.getRepositoryConnectionInfo(
      workspaceId,
      repositoryId,
      user.userId,
    );

    return {
      repositoryId: result.repositoryId,
      credentialsName: result.credentialsName,
      type: result.type,
      status: result.status,
      connectedAt: result.connectedAt,
    };
  }

  /**
   * Keep connection alive and check status
   * Can be called periodically to maintain active connections
   */
  @Get('connection/ping')
  @HttpCode(HttpStatus.OK)
  @CheckAbility({ action: RepositoryPermission.READ, subject: 'Repository' })
  async pingConnection(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @CurrentUser() user: UserSession,
  ): Promise<{
    workspaceId: string;
    repositoryId: string;
    status: 'healthy' | 'unhealthy' | 'disconnected';
    type: string | null;
    responseTime?: number;
    connectedAt?: Date;
    error?: string;
    timestamp: Date;
  }> {
    const result = await this.dataEngineProvider.getConnectionStatus(
      workspaceId,
      repositoryId,
      user.userId,
    );

    return {
      ...result,
      timestamp: new Date(),
    };
  }

  /**
   * Disconnect repository connection
   */
  @Delete('connection')
  @HttpCode(HttpStatus.OK)
  @CheckAbility({ action: RepositoryPermission.UPDATE, subject: 'Repository' })
  async disconnectRepository(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @CurrentUser() _user: UserSession,
  ): Promise<{ success: boolean; message: string }> {
    return await this.dataEngineProvider.disconnectRepository(
      workspaceId,
      repositoryId,
    );
  }

  /**
   * Get native database client (admin endpoint)
   * Use with extreme caution - bypasses connection pool management
   */
  @Get('native-client')
  @HttpCode(HttpStatus.OK)
  @CheckAbility({ action: RepositoryPermission.MANAGE, subject: 'Repository' }) // Requires admin access
  async getNativeClient(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @CurrentUser() user: UserSession,
  ): Promise<{
    type: string;
    warning: string;
    hasClient: boolean;
  }> {
    const result = await this.dataEngineProvider.getNativeClient(
      workspaceId,
      repositoryId,
      user.userId,
    );

    // Don't expose the actual client object for security reasons
    return {
      type: result.type,
      warning: result.warning,
      hasClient: !!result.client,
    };
  }
}

/**
 * Admin Controller for connection pool management
 * Separate controller for admin-only operations
 */
@Controller('admin/data-engine')
@UseGuards(WorkspaceGuard) // Admin guard would be better, but using workspace guard for now
export class DataEngineAdminController {
  constructor(private readonly dataEngineProvider: DataEngineProvider) {}

  /**
   * Get connection pool statistics (admin only)
   */
  @Get('pool/statistics')
  @HttpCode(HttpStatus.OK)
  @CheckAbility({
    action: WorkspaceManagementPermission.MANAGE,
    subject: 'Workspace',
  }) // Admin-level access
  async getPoolStatistics(
    @CurrentUser() _user: UserSession,
  ): Promise<PoolStatisticsResponseDto> {
    const stats = await this.dataEngineProvider.getPoolStatistics();

    return {
      totalConnections: stats.totalConnections,
      activeConnections: stats.activeConnections,
      connectionsByType: stats.connectionsByType,
      connectionsByWorkspace: stats.connectionsByWorkspace,
      timestamp: new Date(),
    };
  }
}
