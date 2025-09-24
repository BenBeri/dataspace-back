import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Logger,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CurrentUser } from '../platform/auth/decorators/current-user.decorator';
import { UserSession } from '../platform/auth/models/user-session.model';
import { CreatePlaygroundRepositoryRequestDto } from '../platform/repository/dto/create-playground-repository-request.dto';
import { RepositoryResponseDto } from '../platform/repository/dto/repository-response.dto';
import { PlaygroundProvider } from './providers/playground.provider';
import { DataEngineProvider } from './providers/data-engine.provider';
import { SchemaDiscoveryService } from './services/schema-discovery.service';

/**
 * Playground Controller
 * Handles repository and credential management for playground workspaces
 */
@Controller('playground')
export class PlaygroundController {
  private readonly logger = new Logger(PlaygroundController.name);

  constructor(
    private readonly playgroundProvider: PlaygroundProvider,
    private readonly dataEngineProvider: DataEngineProvider,
    private readonly schemaDiscoveryService: SchemaDiscoveryService,
  ) {}

  /**
   * Create a new repository in the user's playground workspace
   */
  @Post('repositories')
  @HttpCode(HttpStatus.CREATED)
  async createPlaygroundRepository(
    @Body() createRepositoryDto: CreatePlaygroundRepositoryRequestDto,
    @CurrentUser() user: UserSession,
  ): Promise<RepositoryResponseDto> {
    return await this.playgroundProvider.createPlaygroundRepository(
      createRepositoryDto,
      user.userId,
    );
  }

  /**
   * Save credentials for a playground repository
   */
  @Post('repositories/:repositoryId/credentials')
  @HttpCode(HttpStatus.OK)
  async savePlaygroundCredentials(
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Body()
    credentialsDto: {
      name: string;
      description: string;
      config: any;
    },
    @CurrentUser() user: UserSession,
  ): Promise<{ success: boolean; message: string }> {
    return await this.playgroundProvider.savePlaygroundCredentials(
      repositoryId,
      credentialsDto,
      user.userId,
    );
  }

  /**
   * Keep playground repository connection alive and check status
   * Can be called periodically to maintain active connections
   */
  @Get('repositories/:repositoryId/ping')
  @HttpCode(HttpStatus.OK)
  async pingPlaygroundConnection(
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @CurrentUser() user: UserSession,
  ): Promise<{
    repositoryId: string;
    status: 'healthy' | 'unhealthy' | 'disconnected';
    type: string | null;
    responseTime?: number;
    connectedAt?: Date;
    error?: string;
    timestamp: Date;
  }> {
    // Get user's playground workspace
    const playground =
      await this.playgroundProvider.getPlaygroundWorkspaceForUser(user.userId);

    // Use data engine provider to check connection status
    const result = await this.dataEngineProvider.getConnectionStatus(
      playground.id,
      repositoryId,
      user.userId,
    );

    return {
      repositoryId,
      status: result.status,
      type: result.type,
      responseTime: result.responseTime,
      connectedAt: result.connectedAt,
      error: result.error,
      timestamp: new Date(),
    };
  }

  /**
   * Connect to playground repository and stream schema discovery
   * Real-time connection + schema discovery via SSE
   */
  @Get('repositories/:repositoryId/connect')
  @Sse()
  async connectAndDiscoverSchema(
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @CurrentUser() user: UserSession,
  ): Promise<Observable<MessageEvent>> {
    this.logger.debug(
      `Starting SSE connection and schema discovery for repository ${repositoryId}`,
    );

    return new Observable((observer) => {
      this.streamConnectionAndDiscovery(repositoryId, user, observer);
    });
  }

  /**
   * Stream connection and schema discovery process
   */
  private async streamConnectionAndDiscovery(
    repositoryId: string,
    user: UserSession,
    observer: any,
  ) {
    try {
      // Step 1: Validate repository belongs to user's playground
      observer.next({
        data: JSON.stringify({
          step: 'validating',
          message: 'Validating repository access...',
        }),
      });

      await this.playgroundProvider.validatePlaygroundRepositoryAccess(
        repositoryId,
        user.userId,
      );

      // Step 2: Connect to database
      observer.next({
        data: JSON.stringify({
          step: 'connecting',
          message: 'Establishing database connection...',
        }),
      });

      const playground =
        await this.playgroundProvider.getPlaygroundWorkspaceForUser(
          user.userId,
        );
      const connectionResult =
        await this.dataEngineProvider.testConnectionFromRepository(
          playground.id,
          repositoryId,
          10000, // 10 second timeout
        );

      if (!connectionResult.success) {
        observer.next({
          data: JSON.stringify({
            step: 'error',
            error: connectionResult.error || 'Failed to connect to database',
          }),
        });
        observer.complete();
        return;
      }

      observer.next({
        data: JSON.stringify({
          step: 'connected',
          message: 'Database connection established!',
          serverInfo: connectionResult.serverInfo,
        }),
      });

      // Step 3: Discover tables
      observer.next({
        data: JSON.stringify({
          step: 'discovering_tables',
          message: 'Loading database tables...',
        }),
      });

      const tables = await this.discoverTables(
        playground.id,
        repositoryId,
        user.userId,
      );
      observer.next({
        data: JSON.stringify({
          step: 'tables_loaded',
          message: `Found ${tables.length} tables`,
          tables,
        }),
      });

      // Step 4: Discover views
      observer.next({
        data: JSON.stringify({
          step: 'discovering_views',
          message: 'Loading database views...',
        }),
      });

      const views = await this.discoverViews(
        playground.id,
        repositoryId,
        user.userId,
      );
      observer.next({
        data: JSON.stringify({
          step: 'views_loaded',
          message: `Found ${views.length} views`,
          views,
        }),
      });

      // Step 5: Complete
      observer.next({
        data: JSON.stringify({
          step: 'complete',
          message: 'Schema discovery complete!',
        }),
      });

      observer.complete();
    } catch (error) {
      this.logger.error(
        `Schema discovery failed for repository ${repositoryId}: ${error.message}`,
      );

      observer.next({
        data: JSON.stringify({
          step: 'error',
          error: error.message,
        }),
      });
      observer.error(error);
    }
  }

  /**
   * Discover database tables using real schema introspection
   */
  private async discoverTables(
    workspaceId: string,
    repositoryId: string,
    userId: string,
  ): Promise<any[]> {
    try {
      // Get the database connection and repository info
      const { connection, repositoryType } = await this.getDatabaseConnection(
        workspaceId,
        repositoryId,
        userId,
      );

      // Use schema discovery service to get real table information
      const tables = await this.schemaDiscoveryService.discoverTables(
        connection,
        repositoryType,
      );

      return tables;
    } catch (error) {
      this.logger.error(`Failed to discover tables: ${error.message}`);
      // Return empty array on error to prevent SSE from failing completely
      return [];
    }
  }

  /**
   * Discover database views using real schema introspection
   */
  private async discoverViews(
    workspaceId: string,
    repositoryId: string,
    userId: string,
  ): Promise<any[]> {
    try {
      // Get the database connection and repository info
      const { connection, repositoryType } = await this.getDatabaseConnection(
        workspaceId,
        repositoryId,
        userId,
      );

      // Use schema discovery service to get real view information
      const views = await this.schemaDiscoveryService.discoverViews(
        connection,
        repositoryType,
      );

      return views;
    } catch (error) {
      this.logger.error(`Failed to discover views: ${error.message}`);
      // Return empty array on error to prevent SSE from failing completely
      return [];
    }
  }

  /**
   * Get database connection for a repository
   */
  private async getDatabaseConnection(
    workspaceId: string,
    repositoryId: string,
    userId: string,
  ) {
    // Use the data engine provider to get connection with proper credential resolution
    return await this.dataEngineProvider.getConnectionForSchemaDiscovery(
      workspaceId,
      repositoryId,
      userId,
    );
  }
}
