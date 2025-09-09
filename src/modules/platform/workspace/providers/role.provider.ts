import { Injectable } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { RoleTransformer } from '../transformers/role.transformer';
import { CreateRoleRequestDto } from '../dto/create-role-request.dto';
import { UpdateRoleRequestDto } from '../dto/update-role-request.dto';
import { RoleResponseDto } from '../dto/role-response.dto';
import { CreateRoleDto } from '../dto/create-role.dto';

@Injectable()
export class RoleProvider {
  constructor(
    private readonly roleService: RoleService,
  ) {}

  /**
   * Create a role within a workspace
   */
  async createRole(workspaceId: string, createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    const role = await this.roleService.createRole(
      workspaceId,
      createRoleDto.name,
      createRoleDto.permissions
    );
    return RoleTransformer.toResponseDto(role);
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<RoleResponseDto> {
    const role = await this.roleService.getRoleById(id);
    return RoleTransformer.toResponseDto(role);
  }

  /**
   * Get all roles for a workspace
   */
  async getWorkspaceRoles(workspaceId: string): Promise<RoleResponseDto[]> {
    const roles = await this.roleService.getWorkspaceRoles(workspaceId);
    return RoleTransformer.toResponseDtoArray(roles);
  }

  /**
   * Update role (with admin role protection)
   */
  async updateRole(id: string, updateRoleDto: UpdateRoleRequestDto): Promise<RoleResponseDto> {
    const role = await this.roleService.updateRole(id, updateRoleDto.name, updateRoleDto.permissions);
    return RoleTransformer.toResponseDto(role);
  }

  /**
   * Delete role (with admin role protection)
   */
  async deleteRole(id: string): Promise<{ message: string }> {
    await this.roleService.deleteRole(id);
    return { message: 'Role successfully deleted' };
  }
}
