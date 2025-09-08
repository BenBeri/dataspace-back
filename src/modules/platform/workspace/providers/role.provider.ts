import { Injectable } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { RoleTransformer } from '../transformers/role.transformer';
import { CreateRoleRequestDto } from '../dto/create-role-request.dto';
import { UpdateRoleRequestDto } from '../dto/update-role-request.dto';
import { RoleResponseDto } from '../dto/role-response.dto';

@Injectable()
export class RoleProvider {
  constructor(
    private readonly roleService: RoleService,
  ) {}

  async createRole(createRoleDto: CreateRoleRequestDto): Promise<RoleResponseDto> {
    const role = await this.roleService.createRole(createRoleDto.name, createRoleDto.permissions);
    return RoleTransformer.toResponseDto(role);
  }

  async getRoleById(id: string): Promise<RoleResponseDto> {
    const role = await this.roleService.getRoleById(id);
    return RoleTransformer.toResponseDto(role);
  }

  async getAllRoles(): Promise<RoleResponseDto[]> {
    const roles = await this.roleService.getAllRoles();
    return RoleTransformer.toResponseDtoArray(roles);
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleRequestDto): Promise<RoleResponseDto> {
    const role = await this.roleService.updateRole(id, updateRoleDto.name, updateRoleDto.permissions);
    return RoleTransformer.toResponseDto(role);
  }

  async deleteRole(id: string): Promise<{ message: string }> {
    await this.roleService.deleteRole(id);
    return { message: 'Role successfully deleted' };
  }
}
