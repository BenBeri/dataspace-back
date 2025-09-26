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
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkspaceProvider } from '../providers/workspace.provider';
import { RepositoryPermissionFacade } from '../facades/repository-permission.facade';
import { CreateWorkspaceRequestDto } from '../dto/create-workspace-request.dto';
import { UpdateWorkspaceRequestDto } from '../dto/update-workspace-request.dto';
import { AddMemberRequestDto } from '../dto/add-member-request.dto';
import { UpdateMemberGroupRequestDto } from '../dto/update-member-group-request.dto';
import { WorkspaceResponseDto } from '../dto/workspace-response.dto';
import { WorkspaceMemberResponseDto } from '../dto/workspace-member-response.dto';
import { MyWorkspaceResponseDto } from '../dto/my-workspace-response.dto';
import { GrantRepositoryPermissionRequestDto } from '../dto/grant-repository-permission-request.dto';
import { UserPermissionsResponseDto } from '../dto/user-permissions-response.dto';
import { RepositoryUserAccessResponseDto } from '../dto/repository-user-access-response.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserSession } from '../../auth/models/user-session.model';
import { WorkspaceGuard } from '../guards/workspace.guard';
import { CheckAbility } from '../casl/decorators/check-ability.decorator';
import { Workspace } from '../../entities/workspace/workspace.entity';
import { WorkspaceManagementPermission } from '../casl/permissions/workspace-management-permission.enum';

@Controller('workspaces')
export class WorkspaceController {
  constructor(
    private readonly workspaceProvider: WorkspaceProvider,
    private readonly repositoryPermissionFacade: RepositoryPermissionFacade,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWorkspace(
    @Body() createWorkspaceDto: CreateWorkspaceRequestDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<WorkspaceResponseDto> {
    return await this.workspaceProvider.createWorkspace(
      createWorkspaceDto,
      userSession.userId,
    );
  }

  @Get()
  async getWorkspacesByOwner(
    @Query('ownerId', ParseUUIDPipe) ownerId: string,
  ): Promise<WorkspaceResponseDto[]> {
    return await this.workspaceProvider.getWorkspacesByOwner(ownerId);
  }

  @Get('my-workspaces')
  async getCurrentUserWorkspaces(
    @CurrentUser() userSession: UserSession,
  ): Promise<MyWorkspaceResponseDto[]> {
    return await this.workspaceProvider.getCurrentUserWorkspaces(
      userSession.userId,
    );
  }

  @Get('my-playground-workspace')
  async getCurrentUserPlaygroundWorkspace(
    @CurrentUser() userSession: UserSession,
  ): Promise<MyWorkspaceResponseDto | null> {
    return await this.workspaceProvider.getCurrentUserPlaygroundWorkspace(
      userSession.userId,
    );
  }

  @Get(':id')
  async getWorkspaceById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WorkspaceResponseDto> {
    return await this.workspaceProvider.getWorkspaceById(id);
  }

  @Get('by-key-name/:nameKey')
  async getWorkspaceByNameKey(
    @Param('nameKey') nameKey: string,
  ): Promise<WorkspaceResponseDto> {
    return await this.workspaceProvider.getWorkspaceByNameKey(nameKey);
  }

  @Patch(':id')
  async updateWorkspace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceRequestDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<WorkspaceResponseDto> {
    return await this.workspaceProvider.updateWorkspace(
      id,
      updateWorkspaceDto,
      userSession.userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteWorkspace(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<{ message: string }> {
    return await this.workspaceProvider.deleteWorkspace(id, userSession.userId);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  async addMemberToWorkspace(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Body() addMemberDto: AddMemberRequestDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<WorkspaceMemberResponseDto> {
    return await this.workspaceProvider.addMemberToWorkspace(
      workspaceId,
      addMemberDto,
      userSession.userId,
    );
  }

  @Get(':id/members')
  async getWorkspaceMembers(
    @Param('id', ParseUUIDPipe) workspaceId: string,
  ): Promise<WorkspaceMemberResponseDto[]> {
    return await this.workspaceProvider.getWorkspaceMembers(workspaceId);
  }

  @Patch(':workspaceId/members/:userId/group')
  async updateMemberGroup(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateMemberGroupDto: UpdateMemberGroupRequestDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<WorkspaceMemberResponseDto> {
    return await this.workspaceProvider.updateMemberGroup(
      workspaceId,
      userId,
      updateMemberGroupDto,
      userSession.userId,
    );
  }

  @Delete(':workspaceId/members/:userId')
  @HttpCode(HttpStatus.OK)
  async removeMemberFromWorkspace(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<{ message: string }> {
    return await this.workspaceProvider.removeMemberFromWorkspace(
      workspaceId,
      userId,
      userSession.userId,
    );
  }

  @Get('users/:userId/memberships')
  async getUserWorkspaces(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<WorkspaceMemberResponseDto[]> {
    return await this.workspaceProvider.getUserWorkspaces(userId);
  }

  // Permission Management Routes
  @Post(':workspaceId/repositories/:repositoryId/permissions/users/:userId')
  @HttpCode(HttpStatus.OK)
  async grantRepositoryAccess(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() permissions: GrantRepositoryPermissionRequestDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<UserPermissionsResponseDto> {
    return await this.repositoryPermissionFacade.grantRepositoryAccess(
      workspaceId,
      repositoryId,
      userId,
      permissions,
    );
  }

  @Delete(':workspaceId/repositories/:repositoryId/permissions/users/:userId')
  @HttpCode(HttpStatus.OK)
  async revokeRepositoryAccess(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<UserPermissionsResponseDto> {
    return await this.repositoryPermissionFacade.revokeRepositoryAccess(
      workspaceId,
      repositoryId,
      userId,
    );
  }

  @Get(':workspaceId/users/:userId/permissions')
  async getUserPermissions(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<UserPermissionsResponseDto> {
    return await this.repositoryPermissionFacade.getUserPermissions(
      workspaceId,
      userId,
    );
  }

  @Get(':workspaceId/my-permissions')
  async getMyPermissions(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<UserPermissionsResponseDto> {
    return await this.repositoryPermissionFacade.getUserPermissions(
      workspaceId,
      userSession.userId,
    );
  }

  @Get(':workspaceId/repositories/:repositoryId/users-with-access')
  async getRepositoryUserAccess(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<RepositoryUserAccessResponseDto> {
    return await this.repositoryPermissionFacade.getRepositoryUserAccess(
      workspaceId,
      repositoryId,
    );
  }

  @Post(':id/logo')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WorkspaceGuard)
  @CheckAbility({
    action: WorkspaceManagementPermission.UPDATE,
    subject: Workspace,
  })
  @UseInterceptors(FileInterceptor('logo'))
  async setWorkspaceLogo(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() userSession: UserSession,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Logo file is required');
    }

    const logoUrl = await this.workspaceProvider.setWorkspaceLogo(
      workspaceId,
      file.buffer,
      file.mimetype,
    );
    return { url: logoUrl };
  }

  @Delete(':id/logo')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WorkspaceGuard)
  @CheckAbility({
    action: WorkspaceManagementPermission.UPDATE,
    subject: Workspace,
  })
  async deleteWorkspaceLogo(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<{ message: string }> {
    return await this.workspaceProvider.deleteWorkspaceLogo(workspaceId);
  }
}
