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
} from '@nestjs/common';
import { WorkspaceProvider } from './providers/workspace.provider';
import { CreateWorkspaceRequestDto } from './dto/create-workspace-request.dto';
import { UpdateWorkspaceRequestDto } from './dto/update-workspace-request.dto';
import { AddMemberRequestDto } from './dto/add-member-request.dto';
import { UpdateMemberRoleRequestDto } from './dto/update-member-role-request.dto';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { WorkspaceMemberResponseDto } from './dto/workspace-member-response.dto';
import { MyWorkspaceResponseDto } from './dto/my-workspace-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserSession } from '../auth/models/user-session.model';

@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaceProvider: WorkspaceProvider) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createWorkspace(
    @Body() createWorkspaceDto: CreateWorkspaceRequestDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<WorkspaceResponseDto> {
    return await this.workspaceProvider.createWorkspace(createWorkspaceDto, userSession.userId);
  }

  @Get()
  async getWorkspacesByOwner(@Query('ownerId', ParseUUIDPipe) ownerId: string): Promise<WorkspaceResponseDto[]> {
    return await this.workspaceProvider.getWorkspacesByOwner(ownerId);
  }

  @Get('my-workspaces')
  async getCurrentUserWorkspaces(@CurrentUser() userSession: UserSession): Promise<MyWorkspaceResponseDto[]> {
    return await this.workspaceProvider.getCurrentUserWorkspaces(userSession.userId);
  }

  @Get(':id')
  async getWorkspaceById(@Param('id', ParseUUIDPipe) id: string): Promise<WorkspaceResponseDto> {
    return await this.workspaceProvider.getWorkspaceById(id);
  }

  @Patch(':id')
  async updateWorkspace(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceRequestDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<WorkspaceResponseDto> {
    return await this.workspaceProvider.updateWorkspace(id, updateWorkspaceDto, userSession.userId);
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
    return await this.workspaceProvider.addMemberToWorkspace(workspaceId, addMemberDto, userSession.userId);
  }

  @Get(':id/members')
  async getWorkspaceMembers(@Param('id', ParseUUIDPipe) workspaceId: string): Promise<WorkspaceMemberResponseDto[]> {
    return await this.workspaceProvider.getWorkspaceMembers(workspaceId);
  }

  @Patch(':workspaceId/members/:userId/role')
  async updateMemberRole(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleRequestDto,
    @CurrentUser() userSession: UserSession,
  ): Promise<WorkspaceMemberResponseDto> {
    return await this.workspaceProvider.updateMemberRole(workspaceId, userId, updateMemberRoleDto, userSession.userId);
  }

  @Delete(':workspaceId/members/:userId')
  @HttpCode(HttpStatus.OK)
  async removeMemberFromWorkspace(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() userSession: UserSession,
  ): Promise<{ message: string }> {
    return await this.workspaceProvider.removeMemberFromWorkspace(workspaceId, userId, userSession.userId);
  }

  @Get('users/:userId/memberships')
  async getUserWorkspaces(@Param('userId', ParseUUIDPipe) userId: string): Promise<WorkspaceMemberResponseDto[]> {
    return await this.workspaceProvider.getUserWorkspaces(userId);
  }
}
