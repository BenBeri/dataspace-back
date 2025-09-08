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
import { RoleProvider } from './providers/role.provider';
import { CreateRoleRequestDto } from './dto/create-role-request.dto';
import { UpdateRoleRequestDto } from './dto/update-role-request.dto';
import { RoleResponseDto } from './dto/role-response.dto';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleProvider: RoleProvider) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRole(@Body() createRoleDto: CreateRoleRequestDto): Promise<RoleResponseDto> {
    return await this.roleProvider.createRole(createRoleDto);
  }

  @Get()
  async getAllRoles(): Promise<RoleResponseDto[]> {
    return await this.roleProvider.getAllRoles();
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
