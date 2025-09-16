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
import { RepositoryResponseDto } from './dto/repository-response.dto';
import { PaginatedResponseDto } from '../../../core/dto/paginated-response.dto';
import { GetWorkspaceRepositoriesQueryDto } from './dto/get-workspace-repositories-query.dto';
import { PaginationDto } from '../../../core/dto/pagination.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserSession } from '../auth/models/user-session.model';
import { CheckAbility } from '../workspace/casl/decorators/check-ability.decorator';
import { RepositoryGuard } from './guards/repository.guard';
import { WorkspaceGuard } from '../workspace/guards/workspace.guard';
import { Repository } from '../entities/repository/repository.entity';
import { Workspace } from '../entities/workspace/workspace.entity';
import { RepositoryPermission } from '../workspace/casl/permissions/repository-permission.enum';
import { WorkspaceManagementPermission } from '../workspace/casl/permissions/workspace-management-permission.enum';

@Controller('workspaces/:workspaceId/repositories')
export class RepositoryController {
  constructor(private readonly repositoryProvider: RepositoryProvider) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(WorkspaceGuard)
  @CheckAbility({ action: RepositoryPermission.CREATE, subject: Repository })
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
  @CheckAbility({
    action: WorkspaceManagementPermission.READ,
    subject: Workspace,
  })
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
  @CheckAbility({ action: RepositoryPermission.READ, subject: Repository })
  async getRepositoryById(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<RepositoryResponseDto> {
    return await this.repositoryProvider.getRepositoryById(
      id,
      userSession.userId,
    );
  }

  @Patch(':id')
  @UseGuards(RepositoryGuard)
  @CheckAbility({ action: RepositoryPermission.UPDATE, subject: Repository })
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
  @CheckAbility({ action: RepositoryPermission.DELETE, subject: Repository })
  async deleteRepository(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<{ message: string }> {
    return await this.repositoryProvider.deleteRepository(
      id,
      userSession.userId,
    );
  }


  @Get(':repositoryId/connection/history')
  @UseGuards(RepositoryGuard)
  @CheckAbility({ action: RepositoryPermission.READ, subject: Repository })
  async getConnectionHistory(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Query() query: PaginationDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<PaginatedResponseDto<any>> {
    return await this.repositoryProvider.getConnectionHistory(
      repositoryId,
      query,
      userSession.userId,
    );
  }
}
