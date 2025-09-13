import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { WorkspaceMember } from '../../entities/workspace/workspace-member.entity';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { TransactionManagerService } from '../../shared/services/transaction-manager.service';
import type { PartialWorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';

@Injectable()
export class WorkspaceMemberService {
  constructor(
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async addMemberToWorkspace(
    workspaceId: string,
    userId: string,
    groupId: string,
  ): Promise<WorkspaceMember> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);

    // Check if user is already a member of this workspace
    const existingMember = await repository.findOne({
      where: { workspaceId, userId },
    });

    if (existingMember) {
      throw new ConflictException(`User is already a member of this workspace`);
    }

    const memberData = {
      workspaceId,
      userId,
      groupId,
    };

    const member = repository.create(memberData);
    return await repository.save(member);
  }

  async updateMemberGroup(
    workspaceId: string,
    userId: string,
    groupId: string,
    currentUserId: string,
  ): Promise<WorkspaceMember> {
    const member = await this.getMemberByWorkspaceAndUser(workspaceId, userId);
    const repository = this.transactionManager.getRepository(WorkspaceMember);

    // Note: Group update permissions would be checked in the provider level
    // where we can access workspace ownership information

    await repository.update(member.id, { groupId });

    return await this.getMemberByWorkspaceAndUser(workspaceId, userId);
  }

  async removeMemberFromWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.getMemberByWorkspaceAndUser(workspaceId, userId);
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    await repository.delete(member.id);
  }

  async getMemberByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    const member = await repository.findOne({
      where: { workspaceId, userId },
      relations: ['user', 'group', 'workspace'],
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
      relations: ['user', 'group'],
    });
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceMember[]> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    return await repository.find({
      where: { userId },
      relations: ['workspace', 'group'],
    });
  }

  async isUserMemberOfWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    const count = await repository.count({
      where: { workspaceId, userId },
    });
    return count > 0;
  }

  async getUserGroupInWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    return await repository.findOne({
      where: { workspaceId, userId },
      relations: ['group'],
    });
  }

  async updateMemberPermissions(
    workspaceId: string,
    userId: string,
    permissions: PartialWorkspacePermissions,
  ): Promise<WorkspaceMember> {
    const member = await this.getMemberByWorkspaceAndUser(workspaceId, userId);
    const repository = this.transactionManager.getRepository(WorkspaceMember);

    await repository.update(member.id, { permissions });

    return await this.getMemberByWorkspaceAndUser(workspaceId, userId);
  }

  async getWorkspaceMembersWithDetails(
    workspaceId: string,
  ): Promise<WorkspaceMember[]> {
    const repository = this.transactionManager.getRepository(WorkspaceMember);
    return await repository.find({
      where: { workspaceId },
      relations: ['user', 'group'],
    });
  }
}
