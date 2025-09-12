import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPrivateRepository } from '../../entities/repository/user-private-repository.entity';
import { RepositoryPermissions } from '../../auth/interfaces/workspace-permissions.interface';

@Injectable()
export class UserPrivateRepositoryRepository {
  constructor(
    @InjectRepository(UserPrivateRepository)
    private readonly typeormRepository: Repository<UserPrivateRepository>,
  ) {}

  async create(data: {
    userId: string;
    repositoryId: string;
    permissions: RepositoryPermissions;
    accessReason?: 'invited' | 'owner' | 'admin';
  }): Promise<UserPrivateRepository> {
    const userPrivateRepo = this.typeormRepository.create(data);
    return await this.typeormRepository.save(userPrivateRepo);
  }

  async findByUserId(userId: string): Promise<UserPrivateRepository[]> {
    return await this.typeormRepository.find({
      where: { userId },
      relations: ['repository'],
    });
  }

  async findByRepositoryId(
    repositoryId: string,
  ): Promise<UserPrivateRepository[]> {
    return await this.typeormRepository.find({
      where: { repositoryId },
      relations: ['user'],
    });
  }

  async findByUserAndRepository(
    userId: string,
    repositoryId: string,
  ): Promise<UserPrivateRepository | null> {
    return await this.typeormRepository.findOne({
      where: { userId, repositoryId },
      relations: ['user', 'repository'],
    });
  }

  async findByUserAndWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<UserPrivateRepository[]> {
    return await this.typeormRepository.find({
      where: {
        userId,
        repository: { workspaceId },
      },
      relations: ['repository'],
    });
  }

  async remove(id: string): Promise<void> {
    await this.typeormRepository.delete(id);
  }

  async removeByUserAndRepository(
    userId: string,
    repositoryId: string,
  ): Promise<void> {
    await this.typeormRepository.delete({ userId, repositoryId });
  }

  async updatePermissions(
    userId: string,
    repositoryId: string,
    permissions: RepositoryPermissions,
  ): Promise<UserPrivateRepository> {
    await this.typeormRepository.update(
      { userId, repositoryId },
      { permissions },
    );
    const updated = await this.findByUserAndRepository(userId, repositoryId);
    if (!updated) {
      throw new Error('Failed to update user private repository permissions');
    }
    return updated;
  }
}
