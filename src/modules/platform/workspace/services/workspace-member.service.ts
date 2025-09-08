import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { WorkspaceMember } from '../../entities/workspace/workspace-member.entity';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { TransactionManagerService } from '../../services/transaction-manager.service';

@Injectable()
export class WorkspaceMemberService {
  constructor(
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async addMemberToWorkspace(
    workspaceId: string, 
    userId: string, 
    roleId: string
  ): Promise<WorkspaceMember> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    
    // Check if user is already a member of this workspace
    const existingMember = await repository.findOne({
      where: { workspaceId, userId }
    });

    if (existingMember) {
      throw new ConflictException(`User is already a member of this workspace`);
    }

    const memberData = {
      workspaceId,
      userId,
      roleId,
    };

    const member = repository.create(memberData);
    return await repository.save(member);
  }

  async updateMemberRole(workspaceId: string, userId: string, roleId: string, currentUserId: string): Promise<WorkspaceMember> {
    const member = await this.getMemberByWorkspaceAndUser(workspaceId, userId);
    const repository = this.transactionManager.getRepository(WorkspaceMember);

    // Note: Role update permissions would be checked in the provider level
    // where we can access workspace ownership information

    await repository.update(member.id, { roleId });
    
    return await this.getMemberByWorkspaceAndUser(workspaceId, userId);
  }

  async removeMemberFromWorkspace(workspaceId: string, userId: string): Promise<void> {
    const member = await this.getMemberByWorkspaceAndUser(workspaceId, userId);
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    await repository.delete(member.id);
  }

  async getMemberByWorkspaceAndUser(workspaceId: string, userId: string): Promise<WorkspaceMember> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    const member = await repository.findOne({
      where: { workspaceId, userId },
      relations: ['user', 'role', 'workspace']
    });

    if (!member) {
      throw new NotFoundException(`Member not found in workspace`);
    }

    return member;
  }

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    return await repository.find({
      where: { workspaceId },
      relations: ['user', 'role']
    });
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceMember[]> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    return await repository.find({
      where: { userId },
      relations: ['workspace', 'role']
    });
  }

  async isUserMemberOfWorkspace(workspaceId: string, userId: string): Promise<boolean> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    const count = await repository.count({
      where: { workspaceId, userId }
    });
    return count > 0;
  }

  async getUserRoleInWorkspace(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    return await repository.findOne({
      where: { workspaceId, userId },
      relations: ['role']
    });
  }
}
