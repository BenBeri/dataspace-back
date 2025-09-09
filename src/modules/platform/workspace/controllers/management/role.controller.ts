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
} from '@nestjs/common';
import { RoleProvider } from '../../providers/role.provider';
import { CreateRoleDto } from '../../dto/create-role.dto';
import { UpdateRoleRequestDto } from '../../dto/update-role-request.dto';
import { RoleResponseDto } from '../../dto/role-response.dto';

@Controller('workspaces/:workspaceId/roles')
export class RoleController {
  constructor(private readonly roleProvider: RoleProvider) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRole(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createRoleDto: CreateRoleDto
  ): Promise<RoleResponseDto> {
    return await this.roleProvider.createRole(workspaceId, createRoleDto);
  }

  @Get()
  async getWorkspaceRoles(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string
  ): Promise<RoleResponseDto[]> {
    return await this.roleProvider.getWorkspaceRoles(workspaceId);
  }

  @Get(':id')
  async getRoleById(@Param('id', ParseUUIDPipe) id: string): Promise<RoleResponseDto> {
    return await this.roleProvider.getRoleById(id);
  }

  @Patch(':id')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleRequestDto,
  ): Promise<RoleResponseDto> {
    return await this.roleProvider.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteRole(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    return await this.roleProvider.deleteRole(id);
  }
}
