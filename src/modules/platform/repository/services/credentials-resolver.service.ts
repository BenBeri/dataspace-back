import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { RepositoryCredentials } from '../../entities/repository/repository-credentials.entity';
import { AccessIdentityType } from '../../entities/enums/access-identity-type.enum';
import { RepositoryCredentialsService } from './repository-credentials.service';
import { CredentialsAccessService } from './credentials-access.service';

export interface CredentialsResolutionResult {
  credentials: RepositoryCredentials;
  accessType: 'user' | 'group' | 'default';
  accessDetails: {
    identityId: string;
    identityType: AccessIdentityType;
    grantedBy?: string;
    notes?: string;
  };
}

@Injectable()
export class CredentialsResolverService {
  private readonly logger = new Logger(CredentialsResolverService.name);

  constructor(
    private readonly repositoryCredentialsService: RepositoryCredentialsService,
    private readonly credentialsAccessService: CredentialsAccessService,
  ) {}

  /**
   * Resolve the appropriate credentials for a user accessing a repository
   * Priority: 1) User-specific, 2) Group-based, 3) Default
   */
  async resolveCredentialsForUser(
    repositoryId: string,
    userId: string,
    userGroupIds: string[] = [],
  ): Promise<CredentialsResolutionResult> {
    this.logger.debug(
      `Resolving credentials for repository ${repositoryId}, user ${userId}, groups [${userGroupIds.join(', ')}]`,
    );

    // Get all active credentials for the repository
    const allCredentials =
      await this.repositoryCredentialsService.getActiveCredentialsByRepositoryId(
        repositoryId,
      );

    if (allCredentials.length === 0) {
      throw new NotFoundException(
        `No active credentials found for repository ${repositoryId}`,
      );
    }

    // 1. Check for user-specific credentials access
    for (const credentials of allCredentials) {
      const userAccess = credentials.credentialsAccess?.find(
        (access) =>
          access.identityType === AccessIdentityType.USER &&
          access.identityId === userId,
      );

      if (userAccess) {
        this.logger.debug(
          `Found user-specific credentials: ${credentials.name} for user ${userId}`,
        );
        return {
          credentials,
          accessType: 'user',
          accessDetails: {
            identityId: userId,
            identityType: AccessIdentityType.USER,
            grantedBy: userAccess.grantedBy,
            notes: userAccess.notes,
          },
        };
      }
    }

    // 2. Check for group-based credentials access
    for (const groupId of userGroupIds) {
      for (const credentials of allCredentials) {
        const groupAccess = credentials.credentialsAccess?.find(
          (access) =>
            access.identityType === AccessIdentityType.GROUP &&
            access.identityId === groupId,
        );

        if (groupAccess) {
          this.logger.debug(
            `Found group-based credentials: ${credentials.name} for group ${groupId}`,
          );
          return {
            credentials,
            accessType: 'group',
            accessDetails: {
              identityId: groupId,
              identityType: AccessIdentityType.GROUP,
              grantedBy: groupAccess.grantedBy,
              notes: groupAccess.notes,
            },
          };
        }
      }
    }

    // 3. Fall back to default credentials
    const defaultCredentials =
      await this.repositoryCredentialsService.getDefaultCredentials(
        repositoryId,
      );

    if (!defaultCredentials) {
      throw new NotFoundException(
        `No accessible credentials found for repository ${repositoryId}. ` +
          'User has no specific access and no default credentials are configured.',
      );
    }

    // Check if default credentials have default access configured
    const defaultAccess = defaultCredentials.credentialsAccess?.find(
      (access) =>
        access.identityType === AccessIdentityType.DEFAULT &&
        access.identityId === 'default',
    );

    if (!defaultAccess) {
      throw new NotFoundException(
        `Default credentials exist but default access is not configured for repository ${repositoryId}`,
      );
    }

    this.logger.debug(`Using default credentials: ${defaultCredentials.name}`);
    return {
      credentials: defaultCredentials,
      accessType: 'default',
      accessDetails: {
        identityId: 'default',
        identityType: AccessIdentityType.DEFAULT,
        grantedBy: defaultAccess.grantedBy,
        notes: defaultAccess.notes,
      },
    };
  }

  /**
   * Get all available credentials for a user (for UI display)
   */
  async getAvailableCredentialsForUser(
    repositoryId: string,
    userId: string,
    userGroupIds: string[] = [],
  ): Promise<CredentialsResolutionResult[]> {
    const allCredentials =
      await this.repositoryCredentialsService.getActiveCredentialsByRepositoryId(
        repositoryId,
      );
    const availableCredentials: CredentialsResolutionResult[] = [];

    // Check user-specific access
    for (const credentials of allCredentials) {
      const userAccess = credentials.credentialsAccess?.find(
        (access) =>
          access.identityType === AccessIdentityType.USER &&
          access.identityId === userId,
      );

      if (userAccess) {
        availableCredentials.push({
          credentials,
          accessType: 'user',
          accessDetails: {
            identityId: userId,
            identityType: AccessIdentityType.USER,
            grantedBy: userAccess.grantedBy,
            notes: userAccess.notes,
          },
        });
      }
    }

    // Check group-based access
    for (const groupId of userGroupIds) {
      for (const credentials of allCredentials) {
        // Skip if we already have this credentials through user access
        if (
          availableCredentials.some((c) => c.credentials.id === credentials.id)
        ) {
          continue;
        }

        const groupAccess = credentials.credentialsAccess?.find(
          (access) =>
            access.identityType === AccessIdentityType.GROUP &&
            access.identityId === groupId,
        );

        if (groupAccess) {
          availableCredentials.push({
            credentials,
            accessType: 'group',
            accessDetails: {
              identityId: groupId,
              identityType: AccessIdentityType.GROUP,
              grantedBy: groupAccess.grantedBy,
              notes: groupAccess.notes,
            },
          });
        }
      }
    }

    // Add default credentials if available and not already included
    const defaultCredentials =
      await this.repositoryCredentialsService.getDefaultCredentials(
        repositoryId,
      );

    if (
      defaultCredentials &&
      !availableCredentials.some(
        (c) => c.credentials.id === defaultCredentials.id,
      )
    ) {
      const defaultAccess = defaultCredentials.credentialsAccess?.find(
        (access) =>
          access.identityType === AccessIdentityType.DEFAULT &&
          access.identityId === 'default',
      );

      if (defaultAccess) {
        availableCredentials.push({
          credentials: defaultCredentials,
          accessType: 'default',
          accessDetails: {
            identityId: 'default',
            identityType: AccessIdentityType.DEFAULT,
            grantedBy: defaultAccess.grantedBy,
            notes: defaultAccess.notes,
          },
        });
      }
    }

    return availableCredentials;
  }

  /**
   * Check if user can access any credentials for a repository
   */
  async canUserAccessRepository(
    repositoryId: string,
    userId: string,
    userGroupIds: string[] = [],
  ): Promise<boolean> {
    try {
      await this.resolveCredentialsForUser(repositoryId, userId, userGroupIds);
      return true;
    } catch (error) {
      this.logger.debug(
        `User ${userId} cannot access repository ${repositoryId}: ${error.message}`,
      );
      return false;
    }
  }
}
