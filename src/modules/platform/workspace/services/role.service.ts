import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Role } from '../../entities/workspace/role.entity';
import { RoleRepository } from '../repositories/role.repository';
import { TransactionManagerService } from '../../services/transaction-manager.service';
import { WorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';
import { DefaultRolesHelper, DefaultRoleConfig } from '../helpers/default-roles.helper';
import { CreateRoleDto } from '../dto/create-role.dto';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<Role> {
    const repository = this.transactionManager.getRepository(Role);
    const role = await repository.findOne({ where: { id } });
    
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    return role;
  }

  /**
   * Get role by name within a workspace
   */
  async getRoleByName(workspaceId: string, name: string): Promise<Role> {
    const repository = this.transactionManager.getRepository(Role);
    const role = await repository.findOne({ 
      where: { name, workspaceId } 
    });
    
    if (!role) {
      throw new NotFoundException(`Role with name '${name}' not found in workspace`);
    }
    
    return role;
  }

  /**
   * Create a single role for a workspace
   */
  async createRole(workspaceId: string, name: string, permissions: WorkspacePermissions): Promise<Role> {
    const repository = this.transactionManager.getRepository(Role);
    
    // Check if role with name already exists in this workspace
    const existingRole = await repository.findOne({ 
      where: { name, workspaceId } 
    });
    if (existingRole) {
      throw new ConflictException(`Role with name '${name}' already exists in workspace`);
    }

    const role = repository.create({
      name,
      workspaceId,
      permissions,
    });

    return await repository.save(role);
  }

  /**
   * Create default roles for a new workspace
   */
  async createDefaultRoles(workspaceId: string, customRoles?: CreateRoleDto[]): Promise<Role[]> {
    const repository = this.transactionManager.getRepository(Role);
    const createdRoles: Role[] = [];

    // Always create admin role first
    const adminRole = DefaultRolesHelper.getAdminRole();
    const adminRoleEntity = repository.create({
      name: adminRole.name,
      workspaceId,
      permissions: adminRole.permissions,
    });
    const savedAdminRole = await repository.save(adminRoleEntity);
    createdRoles.push(savedAdminRole);

    // Handle different scenarios for additional roles
    if (customRoles === undefined) {
      // Create default roles (admin, editor, viewer)
      const defaultRoles = DefaultRolesHelper.getDefaultRoles();
      
      for (const roleConfig of defaultRoles.slice(1)) { // Skip admin (already created)
        const roleEntity = repository.create({
          name: roleConfig.name,
          workspaceId,
          permissions: roleConfig.permissions,
        });
        const savedRole = await repository.save(roleEntity);
        createdRoles.push(savedRole);
      }
    } else if (customRoles.length > 0) {
      // Create custom roles (filter out admin if present)
      const filteredRoles = DefaultRolesHelper.filterOutAdminRole(customRoles);
      
      for (const roleDto of filteredRoles) {
        // Check if role name already exists
        const existingRole = await repository.findOne({ 
          where: { name: roleDto.name, workspaceId } 
        });
        if (!existingRole) {
          const roleEntity = repository.create({
            name: roleDto.name,
            workspaceId,
            permissions: roleDto.permissions,
          });
          const savedRole = await repository.save(roleEntity);
          createdRoles.push(savedRole);
        }
      }
    }

    return createdRoles;
  }

  /**
   * Get all roles for a workspace
   */
  async getWorkspaceRoles(workspaceId: string): Promise<Role[]> {
    const repository = this.transactionManager.getRepository(Role);
    return await repository.find({ 
      where: { workspaceId },
      order: { name: 'ASC' }
    });
  }

  /**
   * Check if role exists by ID
   */
  async roleExists(id: string): Promise<boolean> {
    const repository = this.transactionManager.getRepository(Role);
    const count = await repository.count({ where: { id } });
    return count > 0;
  }

  /**
   * Check if role exists by name within workspace
   */
  async roleExistsByName(workspaceId: string, name: string): Promise<boolean> {
    const repository = this.transactionManager.getRepository(Role);
    const count = await repository.count({ 
      where: { name, workspaceId } 
    });
    return count > 0;
  }

  /**
   * Update role (with admin role protection)
   */
  async updateRole(id: string, name?: string, permissions?: WorkspacePermissions): Promise<Role> {
    const role = await this.getRoleById(id);
    
    // Prevent modification of admin role
    if (role.name === 'admin') {
      throw new ForbiddenException('Admin role cannot be modified');
    }

    const repository = this.transactionManager.getRepository(Role);

    // Check if new name already exists for another role in the same workspace
    if (name && name !== role.name) {
      const existingRole = await repository.findOne({ 
        where: { name, workspaceId: role.workspaceId } 
      });
      if (existingRole && existingRole.id !== id) {
        throw new ConflictException(`Role with name '${name}' already exists in workspace`);
      }
    }

    if (name !== undefined) {
      role.name = name;
    }
    if (permissions !== undefined) {
      role.permissions = permissions;
    }

    return await repository.save(role);
  }

  /**
   * Delete role (with admin role protection)
   */
  async deleteRole(id: string): Promise<void> {
    const role = await this.getRoleById(id);
    
    // Prevent deletion of admin role
    if (role.name === 'admin') {
      throw new ForbiddenException('Admin role cannot be deleted');
    }

    const repository = this.transactionManager.getRepository(Role);
    await repository.remove(role);
  }

  /**
   * Get admin role for a workspace
   */
  async getAdminRole(workspaceId: string): Promise<Role> {
    return await this.getRoleByName(workspaceId, 'admin');
  }
}
