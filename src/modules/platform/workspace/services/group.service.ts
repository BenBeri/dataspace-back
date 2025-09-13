import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Group } from '../../entities/workspace/group.entity';
import { GroupRepository } from '../repositories/group.repository';
import { TransactionManagerService } from '../../shared/services/transaction-manager.service';
import { WorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';
import {
  DefaultGroupsHelper,
  DefaultGroupConfig,
} from '../helpers/default-groups.helper';
import { CreateGroupDto } from '../dto/create-group.dto';

@Injectable()
export class GroupService {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * Get group by ID
   */
  async getGroupById(id: string): Promise<Group> {
    const repository = this.transactionManager.getRepository(Group);
    const group = await repository.findOne({ where: { id } });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  /**
   * Get group by name within a workspace
   */
  async getGroupByName(workspaceId: string, name: string): Promise<Group> {
    const repository = this.transactionManager.getRepository(Group);
    const group = await repository.findOne({
      where: { name, workspaceId },
    });

    if (!group) {
      throw new NotFoundException(
        `Group with name '${name}' not found in workspace`,
      );
    }

    return group;
  }

  /**
   * Create a single group for a workspace
   */
  async createGroup(
    workspaceId: string,
    name: string,
    permissions: WorkspacePermissions,
  ): Promise<Group> {
    const repository = this.transactionManager.getRepository(Group);

    // Check if group with same name already exists in this workspace
    const existingGroup = await repository.findOne({
      where: { name, workspaceId },
    });

    if (existingGroup) {
      throw new ConflictException(
        `Group with name '${name}' already exists in this workspace`,
      );
    }

    const group = repository.create({
      name,
      workspaceId,
      permissions,
    });

    return await repository.save(group);
  }

  /**
   * Create default groups for a new workspace
   */
  async createDefaultGroups(
    workspaceId: string,
    customGroups?: CreateGroupDto[],
  ): Promise<Group[]> {
    const repository = this.transactionManager.getRepository(Group);
    const createdGroups: Group[] = [];

    // Always create admin group first
    const adminGroup = DefaultGroupsHelper.getAdminGroup();
    const adminGroupEntity = repository.create({
      name: adminGroup.name,
      workspaceId,
      permissions: adminGroup.permissions,
    });
    const savedAdminGroup = await repository.save(adminGroupEntity);
    createdGroups.push(savedAdminGroup);

    // Handle different scenarios for additional groups
    if (customGroups === undefined) {
      // Create default groups (admin, editor, viewer)
      const defaultGroups = DefaultGroupsHelper.getDefaultGroups();

      for (const groupConfig of defaultGroups.slice(1)) {
        // Skip admin (already created)
        const groupEntity = repository.create({
          name: groupConfig.name,
          workspaceId,
          permissions: groupConfig.permissions,
        });
        const savedGroup = await repository.save(groupEntity);
        createdGroups.push(savedGroup);
      }
    } else if (customGroups.length > 0) {
      // Create custom groups (filter out admin if present)
      const filteredGroups =
        DefaultGroupsHelper.filterOutAdminGroup(customGroups);

      for (const groupDto of filteredGroups) {
        // Check if group name already exists
        const existingGroup = await repository.findOne({
          where: { name: groupDto.name, workspaceId },
        });
        if (!existingGroup) {
          const groupEntity = repository.create({
            name: groupDto.name,
            workspaceId,
            permissions: groupDto.permissions,
          });
          const savedGroup = await repository.save(groupEntity);
          createdGroups.push(savedGroup);
        }
      }
    }

    return createdGroups;
  }

  /**
   * Get all groups for a workspace
   */
  async getWorkspaceGroups(workspaceId: string): Promise<Group[]> {
    const repository = this.transactionManager.getRepository(Group);
    return await repository.find({
      where: { workspaceId },
      order: { name: 'ASC' },
    });
  }

  /**
   * Update a group's permissions
   */
  async updateGroupPermissions(
    groupId: string,
    permissions: WorkspacePermissions,
    currentUserId: string,
  ): Promise<Group> {
    const group = await this.getGroupById(groupId);
    const repository = this.transactionManager.getRepository(Group);

    // Note: Permission update validation should be done at provider/facade level
    await repository.update(groupId, { permissions });

    return await this.getGroupById(groupId);
  }

  /**
   * Update group name
   */
  async updateGroupName(
    groupId: string,
    newName: string,
    currentUserId: string,
  ): Promise<Group> {
    const group = await this.getGroupById(groupId);
    const repository = this.transactionManager.getRepository(Group);

    // Check if another group with the same name exists in the workspace
    const existingGroup = await repository.findOne({
      where: {
        name: newName,
        workspaceId: group.workspaceId,
      },
    });

    if (existingGroup && existingGroup.id !== groupId) {
      throw new ConflictException(
        `Group with name '${newName}' already exists in this workspace`,
      );
    }

    await repository.update(groupId, { name: newName });
    return await this.getGroupById(groupId);
  }

  /**
   * Delete a group
   */
  async deleteGroup(groupId: string, currentUserId: string): Promise<void> {
    const group = await this.getGroupById(groupId);

    // Prevent deletion of admin group
    if (group.name === 'admin') {
      throw new ForbiddenException('Cannot delete admin group');
    }

    const repository = this.transactionManager.getRepository(Group);

    // Note: Should check if any members are using this group and handle accordingly
    // This validation should be done at provider/facade level

    await repository.delete(groupId);
  }

  /**
   * Get admin group for a workspace
   */
  async getAdminGroup(workspaceId: string): Promise<Group> {
    return await this.getGroupByName(workspaceId, 'admin');
  }

  /**
   * Check if a group has specific permissions
   */
  hasPermission(group: Group, permission: string): boolean {
    // This would implement permission checking logic
    // For now, just return basic check
    const permissions = group.permissions as any;
    return permissions?.[permission] === true;
  }
}
