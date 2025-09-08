import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RepositoryProvider } from './providers/repository.provider';
import { CreateRepositoryRequestDto } from './dto/create-repository-request.dto';
import { UpdateRepositoryRequestDto } from './dto/update-repository-request.dto';
import { UpdateDataSourceRequestDto } from './dto/update-data-source-request.dto';
import { RepositoryResponseDto } from './dto/repository-response.dto';
import { DataSourceResponseDto } from './dto/data-source-response.dto';
import { DataSourceChangeHistoryResponseDto } from './dto/data-source-change-history-response.dto';
import { DataSourceConfigurationResponseDto } from './dto/data-source-configuration-response.dto';
import { PaginatedResponseDto } from '../../../core/dto/paginated-response.dto';
import { GetWorkspaceRepositoriesQueryDto } from './dto/get-workspace-repositories-query.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserSession } from '../auth/models/user-session.model';
import { CheckAbility } from '../auth/decorators/check-ability.decorator';
import { RepositoryGuard } from '../auth/guards/repository.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { Repository } from '../entities/repository/repository.entity';
import { Workspace } from '../entities/workspace/workspace.entity';

@Controller('workspaces/:workspaceId/repositories')
export class RepositoryController {
  constructor(private readonly repositoryProvider: RepositoryProvider) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(WorkspaceGuard)
  @CheckAbility({ action: 'create', subject: Repository })
  async createRepository(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createRepositoryDto: CreateRepositoryRequestDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<RepositoryResponseDto> {
    return await this.repositoryProvider.createRepository(
      createRepositoryDto,
      workspaceId,
      userSession.userId,
    );
  }

  @Get()
  @UseGuards(WorkspaceGuard)
  @CheckAbility({ action: 'read', subject: Workspace })
  async getRepositoriesByWorkspace(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: GetWorkspaceRepositoriesQueryDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<PaginatedResponseDto<RepositoryResponseDto>> {
    return await this.repositoryProvider.getRepositoriesByWorkspace(
      workspaceId,
      query,
      userSession.userId,
    );
  }

  @Get(':id')
  @UseGuards(RepositoryGuard)
  @CheckAbility({ action: 'read', subject: Repository })
  async getRepositoryById(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<RepositoryResponseDto> {
    return await this.repositoryProvider.getRepositoryById(id, userSession.userId);
  }

  @Patch(':id')
  @UseGuards(RepositoryGuard)
  @CheckAbility({ action: 'update', subject: Repository })
  async updateRepository(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRepositoryDto: UpdateRepositoryRequestDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<RepositoryResponseDto> {
    return await this.repositoryProvider.updateRepository(
      id,
      updateRepositoryDto,
      userSession.userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RepositoryGuard)
  @CheckAbility({ action: 'delete', subject: Repository })
  async deleteRepository(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<{ message: string }> {
    return await this.repositoryProvider.deleteRepository(id, userSession.userId);
  }

  // Data Source endpoints (no separate creation - created with repository)

  @Get(':repositoryId/data-source')
  @UseGuards(RepositoryGuard)
  @CheckAbility({ action: 'read', subject: Repository })
  async getDataSourceByRepositoryId(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<DataSourceResponseDto | null> {
    return await this.repositoryProvider.getDataSourceByRepositoryId(
      repositoryId,
      userSession.userId,
    );
  }

  @Get(':repositoryId/data-source/configuration')
  @UseGuards(RepositoryGuard)
  @CheckAbility({ action: 'read', subject: Repository })
  async getDataSourceConfiguration(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<DataSourceConfigurationResponseDto | null> {
    return await this.repositoryProvider.getDataSourceConfiguration(
      repositoryId,
      userSession.userId,
    );
  }

  @Patch(':repositoryId/data-source/:dataSourceId')
  @UseGuards(RepositoryGuard)
  @CheckAbility({ action: 'update', subject: Repository })
  async updateDataSource(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
    @Body() updateDataSourceDto: UpdateDataSourceRequestDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<DataSourceResponseDto> {
    return await this.repositoryProvider.updateDataSource(
      repositoryId,
      dataSourceId,
      updateDataSourceDto,
      userSession.userId,
    );
  }

  @Delete(':repositoryId/data-source/:dataSourceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RepositoryGuard)
  @CheckAbility({ action: 'delete', subject: Repository })
  async deleteDataSource(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<{ message: string }> {
    return await this.repositoryProvider.deleteDataSource(
      repositoryId,
      dataSourceId,
      userSession.userId,
    );
  }

  @Get(':repositoryId/data-source/:dataSourceId/history')
  @UseGuards(RepositoryGuard)
  @CheckAbility({ action: 'read', subject: Repository })
  async getDataSourceChangeHistory(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Param('dataSourceId', ParseUUIDPipe) dataSourceId: string,
    @Query() query: PaginationDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<PaginatedResponseDto<DataSourceChangeHistoryResponseDto>> {
    return await this.repositoryProvider.getDataSourceChangeHistory(
      repositoryId,
      dataSourceId,
      query,
      userSession.userId,
    );
  }
}
