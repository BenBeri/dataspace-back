import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CredentialsAccess } from '../../entities/repository/credentials-access.entity';
import { AccessIdentityType } from '../../entities/enums/access-identity-type.enum';
import { CredentialsAccessRepository } from '../repositories/credentials-access.repository';

@Injectable()
export class CredentialsAccessService {
  constructor(
    private readonly credentialsAccessRepository: CredentialsAccessRepository,
  ) {}

  /**
   * Grant user access to specific credentials
   */
  async grantUserAccess(
    credentialsId: string,
    userId: string,
    grantedBy: string,
    notes?: string,
  ): Promise<CredentialsAccess> {
    // Check if access already exists
    const existing =
      await this.credentialsAccessRepository.findByCredentialsAndUser(
        credentialsId,
        userId,
      );

    if (existing) {
      throw new BadRequestException(
        'User already has access to these credentials',
      );
    }

    const accessData = {
      credentialsId,
      identityType: AccessIdentityType.USER,
      identityId: userId,
      grantedBy,
      notes,
    };

    return await this.credentialsAccessRepository.create(accessData);
  }

  /**
   * Grant group access to specific credentials
   */
  async grantGroupAccess(
    credentialsId: string,
    groupId: string,
    grantedBy: string,
    notes?: string,
  ): Promise<CredentialsAccess> {
    // Check if access already exists
    const existing =
      await this.credentialsAccessRepository.findByCredentialsAndGroup(
        credentialsId,
        groupId,
      );

    if (existing) {
      throw new BadRequestException(
        'Group already has access to these credentials',
      );
    }

    const accessData = {
      credentialsId,
      identityType: AccessIdentityType.GROUP,
      identityId: groupId,
      grantedBy,
      notes,
    };

    return await this.credentialsAccessRepository.create(accessData);
  }

  /**
   * Create default access entry for credentials
   */
  async createDefaultAccess(
    credentialsId: string,
    grantedBy: string,
    notes?: string,
  ): Promise<CredentialsAccess> {
    const accessData = {
      credentialsId,
      identityType: AccessIdentityType.DEFAULT,
      identityId: 'default',
      grantedBy,
      notes: notes || 'Default access for all repository users',
    };

    return await this.credentialsAccessRepository.create(accessData);
  }

  /**
   * Remove user access to credentials
   */
  async revokeUserAccess(credentialsId: string, userId: string): Promise<void> {
    await this.credentialsAccessRepository.removeAccess(
      credentialsId,
      AccessIdentityType.USER,
      userId,
    );
  }

  /**
   * Remove group access to credentials
   */
  async revokeGroupAccess(
    credentialsId: string,
    groupId: string,
  ): Promise<void> {
    await this.credentialsAccessRepository.removeAccess(
      credentialsId,
      AccessIdentityType.GROUP,
      groupId,
    );
  }

  /**
   * Remove default access to credentials
   */
  async revokeDefaultAccess(credentialsId: string): Promise<void> {
    await this.credentialsAccessRepository.removeAccess(
      credentialsId,
      AccessIdentityType.DEFAULT,
      'default',
    );
  }

  /**
   * Get all access entries for specific credentials
   */
  async getCredentialsAccess(
    credentialsId: string,
  ): Promise<CredentialsAccess[]> {
    return await this.credentialsAccessRepository.findByCredentialsId(
      credentialsId,
    );
  }

  /**
   * Get all credentials access for a specific user
   */
  async getUserCredentialsAccess(userId: string): Promise<CredentialsAccess[]> {
    return await this.credentialsAccessRepository.findByUserId(userId);
  }

  /**
   * Get all credentials access for a specific group
   */
  async getGroupCredentialsAccess(
    groupId: string,
  ): Promise<CredentialsAccess[]> {
    return await this.credentialsAccessRepository.findByGroupId(groupId);
  }

  /**
   * Check if user has access to specific credentials (direct or through group)
   */
  async hasUserAccess(
    credentialsId: string,
    userId: string,
    userGroupIds: string[] = [],
  ): Promise<boolean> {
    // Check direct user access
    const userAccess =
      await this.credentialsAccessRepository.findByCredentialsAndUser(
        credentialsId,
        userId,
      );
    if (userAccess) {
      return true;
    }

    // Check group access
    for (const groupId of userGroupIds) {
      const groupAccess =
        await this.credentialsAccessRepository.findByCredentialsAndGroup(
          credentialsId,
          groupId,
        );
      if (groupAccess) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update access entry notes
   */
  async updateAccessNotes(
    accessId: string,
    notes: string,
  ): Promise<CredentialsAccess> {
    const access = await this.credentialsAccessRepository.findById(accessId);
    if (!access) {
      throw new NotFoundException('Credentials access entry not found');
    }

    await this.credentialsAccessRepository.updateWithData(accessId, { notes });
    const updated = await this.credentialsAccessRepository.findById(accessId);
    if (!updated) {
      throw new NotFoundException(
        'Credentials access entry not found after update',
      );
    }
    return updated;
  }

  /**
   * Remove all access for specific credentials
   */
  async removeAllAccess(credentialsId: string): Promise<void> {
    await this.credentialsAccessRepository.removeByCredentialsId(credentialsId);
  }

  /**
   * Get access entries by credentials ID
   */
  async getAccessByCredentials(
    credentialsId: string,
  ): Promise<CredentialsAccess[]> {
    return await this.credentialsAccessRepository.findByCredentialsId(credentialsId);
  }

  /**
   * Get available credentials for user (simplified implementation)
   */
  async getAvailableCredentialsForUser(
    repositoryId: string,
    userId: string,
    userGroupIds: string[],
  ): Promise<{
    repositoryId: string;
    availableCredentials: Array<{
      credentials: {
        id: string;
        name: string;
        description: string;
        isDefault: boolean;
        isActive: boolean;
      };
      accessType: 'user' | 'group' | 'default';
      accessDetails: {
        identityId: string;
        identityType: AccessIdentityType;
        grantedBy?: string;
        notes?: string;
      };
    }>;
  }> {
    // Simplified implementation for now
    return {
      repositoryId,
      availableCredentials: [],
    };
  }
}
