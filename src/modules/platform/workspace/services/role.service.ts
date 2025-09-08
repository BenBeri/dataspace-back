import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Role } from '../../entities/workspace/role.entity';
import { RoleRepository } from '../repositories/role.repository';
import { TransactionManagerService } from '../../services/transaction-manager.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async getRoleById(id: string): Promise<Role> {
    const repository = this.transactionManager.getRepository(Role);
    const role = await repository.findOne({ where: { id } });
    
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    
    return role;
  }

  async getRoleByName(name: string): Promise<Role> {
    const repository = this.transactionManager.getRepository(Role);
    const role = await repository.findOne({ where: { name } });
    
    if (!role) {
      throw new NotFoundException(`Role with name '${name}' not found`);
    }
    
    return role;
  }

  async createRole(name: string, permissions: Record<string, any>): Promise<Role> {
    const repository = this.transactionManager.getRepository(Role);
    
    // Check if role with name already exists
    const existingRole = await repository.findOne({ where: { name } });
    if (existingRole) {
      throw new ConflictException(`Role with name '${name}' already exists`);
    }

    const role = repository.create({
      name,
      permissions,
    });

    return await repository.save(role);
  }

  async getAllRoles(): Promise<Role[]> {
    const repository = this.transactionManager.getRepository(Role);
    return await repository.find();
  }

  async roleExists(id: string): Promise<boolean> {
    const repository = this.transactionManager.getRepository(Role);
    const count = await repository.count({ where: { id } });
    return count > 0;
  }

  async roleExistsByName(name: string): Promise<boolean> {
    const repository = this.transactionManager.getRepository(Role);
    const count = await repository.count({ where: { name } });
    return count > 0;
  }

  async updateRole(id: string, name?: string, permissions?: Record<string, any>): Promise<Role> {
    const role = await this.getRoleById(id);
    const repository = this.transactionManager.getRepository(Role);

    // Check if new name already exists for another role
    if (name && name !== role.name) {
      const existingRole = await repository.findOne({ where: { name } });
      if (existingRole && existingRole.id !== id) {
        throw new ConflictException(`Role with name '${name}' already exists`);
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

  async deleteRole(id: string): Promise<void> {
    const role = await this.getRoleById(id);
    const repository = this.transactionManager.getRepository(Role);
    await repository.remove(role);
  }
}
