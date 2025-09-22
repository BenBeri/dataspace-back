import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { CredentialsAccess } from '../../entities/repository/credentials-access.entity';
import { AccessIdentityType } from '../../entities/enums/access-identity-type.enum';

@Injectable()
export class CredentialsAccessRepository {
  constructor(
    @InjectRepository(CredentialsAccess)
    private readonly repository: TypeOrmRepository<CredentialsAccess>,
  ) {}

  /**
   * Find access entries by credentials ID
   */
  async findByCredentialsId(
    credentialsId: string,
  ): Promise<CredentialsAccess[]> {
    return await this.repository.find({
      where: { credentialsId },
      relations: ['credentials'],
    });
  }

  /**
   * Create new credentials access
   */
  async create(
    accessData: Partial<CredentialsAccess>,
  ): Promise<CredentialsAccess> {
    const entity = this.repository.create(accessData);
    return await this.repository.save(entity);
  }

  /**
   * Find by ID with relations
   */
  async findById(id: string): Promise<CredentialsAccess | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['credentials'],
    });
  }

  /**
   * Update with data
   */
  async updateWithData(
    id: string,
    updateData: Partial<CredentialsAccess>,
  ): Promise<void> {
    await this.repository.update(id, updateData);
  }

  /**
   * Find access entry for specific user and credentials
   */
  async findByCredentialsAndUser(
    credentialsId: string,
    userId: string,
  ): Promise<CredentialsAccess | null> {
    return await this.repository.findOne({
      where: {
        credentialsId,
        identityType: AccessIdentityType.USER,
        identityId: userId,
      },
      relations: ['credentials'],
    });
  }

  /**
   * Find access entry for specific group and credentials
   */
  async findByCredentialsAndGroup(
    credentialsId: string,
    groupId: string,
  ): Promise<CredentialsAccess | null> {
    return await this.repository.findOne({
      where: {
        credentialsId,
        identityType: AccessIdentityType.GROUP,
        identityId: groupId,
      },
      relations: ['credentials'],
    });
  }

  /**
   * Find all access entries for a user (direct user access)
   */
  async findByUserId(userId: string): Promise<CredentialsAccess[]> {
    return await this.repository.find({
      where: {
        identityType: AccessIdentityType.USER,
        identityId: userId,
      },
      relations: ['credentials', 'credentials.repository'],
    });
  }

  /**
   * Find all access entries for a group
   */
  async findByGroupId(groupId: string): Promise<CredentialsAccess[]> {
    return await this.repository.find({
      where: {
        identityType: AccessIdentityType.GROUP,
        identityId: groupId,
      },
      relations: ['credentials', 'credentials.repository'],
    });
  }

  /**
   * Remove all access for specific credentials
   */
  async removeByCredentialsId(credentialsId: string): Promise<void> {
    await this.repository.delete({ credentialsId });
  }

  /**
   * Remove specific access entry
   */
  async removeAccess(
    credentialsId: string,
    identityType: AccessIdentityType,
    identityId: string,
  ): Promise<void> {
    await this.repository.delete({
      credentialsId,
      identityType,
      identityId,
    });
  }
}
