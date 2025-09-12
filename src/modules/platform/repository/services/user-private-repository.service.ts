import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UserPrivateRepositoryRepository } from '../repositories/user-private-repository.repository';
import { UserPrivateRepository } from '../../entities/repository/user-private-repository.entity';
import { RepositoryPermissions } from '../../auth/interfaces/workspace-permissions.interface';
import { TransactionManagerService } from '../../shared/services/transaction-manager.service';

export interface UserRepositoryAccess {
  userId: string;
  repositoryId: string;
  permissions: RepositoryPermissions;
  accessReason: 'invited' | 'owner' | 'admin';
  user?: any;
  repository?: any;
}

@Injectable()
export class UserPrivateRepositoryService {
  constructor(
    private readonly userPrivateRepositoryRepository: UserPrivateRepositoryRepository,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * Mission 1: Grant user access to a private repository
   */
  async grantUserAccessToPrivateRepository(
    userId: string,
    repositoryId: string,
    permissions: RepositoryPermissions,
    accessReason: 'invited' | 'owner' | 'admin' = 'invited',
  ): Promise<UserPrivateRepository> {
    // Check if user already has access
    const existing =
      await this.userPrivateRepositoryRepository.findByUserAndRepository(
        userId,
        repositoryId,
      );

    if (existing) {
      throw new ConflictException(
        'User already has access to this private repository',
      );
    }

    return await this.userPrivateRepositoryRepository.create({
      userId,
      repositoryId,
      permissions,
      accessReason,
    });
  }

  /**
   * Mission 2: Get all users with access to a specific repository
   */
  async getUsersWithAccessToRepository(
    repositoryId: string,
  ): Promise<UserRepositoryAccess[]> {
    const access =
      await this.userPrivateRepositoryRepository.findByRepositoryId(
        repositoryId,
      );

    return access.map((item) => ({
      userId: item.userId,
      repositoryId: item.repositoryId,
      permissions: item.permissions,
      accessReason: item.accessReason,
      user: item.user,
      repository: item.repository,
    }));
  }

  /**
   * Get user's private repository access for a specific workspace
   */
  async getUserPrivateRepositoryAccess(
    userId: string,
    workspaceId: string,
  ): Promise<UserRepositoryAccess[]> {
    const access =
      await this.userPrivateRepositoryRepository.findByUserAndWorkspace(
        userId,
        workspaceId,
      );

    return access.map((item) => ({
      userId: item.userId,
      repositoryId: item.repositoryId,
      permissions: item.permissions,
      accessReason: item.accessReason,
      repository: item.repository,
    }));
  }

  /**
   * Check if user has access to a specific private repository
   */
  async hasAccessToPrivateRepository(
    userId: string,
    repositoryId: string,
  ): Promise<UserPrivateRepository | null> {
    return await this.userPrivateRepositoryRepository.findByUserAndRepository(
      userId,
      repositoryId,
    );
  }

  /**
   * Update user's permissions for a private repository
   */
  async updateUserRepositoryPermissions(
    userId: string,
    repositoryId: string,
    permissions: RepositoryPermissions,
  ): Promise<UserPrivateRepository> {
    const existing =
      await this.userPrivateRepositoryRepository.findByUserAndRepository(
        userId,
        repositoryId,
      );

    if (!existing) {
      throw new NotFoundException(
        'User does not have access to this private repository',
      );
    }

    return await this.userPrivateRepositoryRepository.updatePermissions(
      userId,
      repositoryId,
      permissions,
    );
  }

  /**
   * Revoke user's access to a private repository
   */
  async revokeUserAccessToPrivateRepository(
    userId: string,
    repositoryId: string,
  ): Promise<void> {
    const existing =
      await this.userPrivateRepositoryRepository.findByUserAndRepository(
        userId,
        repositoryId,
      );

    if (!existing) {
      throw new NotFoundException(
        'User does not have access to this private repository',
      );
    }

    await this.userPrivateRepositoryRepository.removeByUserAndRepository(
      userId,
      repositoryId,
    );
  }

  /**
   * Get all private repositories a user has access to
   */
  async getUserPrivateRepositories(
    userId: string,
  ): Promise<UserRepositoryAccess[]> {
    const access =
      await this.userPrivateRepositoryRepository.findByUserId(userId);

    return access.map((item) => ({
      userId: item.userId,
      repositoryId: item.repositoryId,
      permissions: item.permissions,
      accessReason: item.accessReason,
      repository: item.repository,
    }));
  }
}
