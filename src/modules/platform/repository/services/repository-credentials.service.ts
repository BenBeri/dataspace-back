import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { RepositoryCredentials } from '../../entities/repository/repository-credentials.entity';
import { RepositoryCredentialsRepository } from '../repositories/repository-credentials.repository';

@Injectable()
export class RepositoryCredentialsService {
  constructor(
    private readonly repositoryCredentialsRepository: RepositoryCredentialsRepository,
  ) {}

  /**
   * Create new credentials for a repository
   */
  async createCredentials(
    repositoryId: string,
    name: string,
    description: string,
    encryptedCredentials: string,
    isDefault: boolean = false,
  ): Promise<RepositoryCredentials> {
    // Check if name already exists for this repository
    const existing =
      await this.repositoryCredentialsRepository.findByRepositoryIdAndName(
        repositoryId,
        name,
      );

    if (existing) {
      throw new BadRequestException(
        `Credentials with name '${name}' already exist for this repository`,
      );
    }

    // If setting as default, ensure no other default exists
    if (isDefault) {
      const hasDefault =
        await this.repositoryCredentialsRepository.hasDefaultCredentials(
          repositoryId,
        );
      if (hasDefault) {
        throw new BadRequestException(
          'Default credentials already exist for this repository. Please remove existing default first.',
        );
      }
    }

    const credentialsData = {
      repositoryId,
      name,
      description,
      encryptedCredentials,
      isDefault,
    };

    return await this.repositoryCredentialsRepository.create(credentialsData);
  }

  /**
   * Update existing credentials
   */
  async updateCredentials(
    credentialsId: string,
    updates: {
      name?: string;
      description?: string;
      encryptedCredentials?: string;
      isActive?: boolean;
    },
  ): Promise<RepositoryCredentials> {
    const credentials =
      await this.repositoryCredentialsRepository.findById(credentialsId);
    if (!credentials) {
      throw new NotFoundException('Credentials not found');
    }

    // If updating name, check for uniqueness within repository
    if (updates.name && updates.name !== credentials.name) {
      const existing =
        await this.repositoryCredentialsRepository.findByRepositoryIdAndName(
          credentials.repositoryId,
          updates.name,
        );
      if (existing && existing.id !== credentialsId) {
        throw new BadRequestException(
          `Credentials with name '${updates.name}' already exist for this repository`,
        );
      }
    }

    await this.repositoryCredentialsRepository.updateWithData(
      credentialsId,
      updates,
    );
    const updated =
      await this.repositoryCredentialsRepository.findById(credentialsId);
    if (!updated) {
      throw new NotFoundException('Credentials not found after update');
    }
    return updated;
  }

  /**
   * Set credentials as default (removes default from others in same repository)
   */
  async setAsDefault(credentialsId: string): Promise<RepositoryCredentials> {
    const credentials =
      await this.repositoryCredentialsRepository.findById(credentialsId);
    if (!credentials) {
      throw new NotFoundException('Credentials not found');
    }

    // First remove default flag from all other credentials in this repository
    const allCredentials =
      await this.repositoryCredentialsRepository.findByRepositoryId(
        credentials.repositoryId,
      );

    for (const cred of allCredentials) {
      if (cred.isDefault && cred.id !== credentialsId) {
        await this.repositoryCredentialsRepository.updateWithData(cred.id, {
          isDefault: false,
        });
      }
    }

    // Set this one as default
    await this.repositoryCredentialsRepository.updateWithData(credentialsId, {
      isDefault: true,
    });

    const updated =
      await this.repositoryCredentialsRepository.findById(credentialsId);
    if (!updated) {
      throw new NotFoundException('Credentials not found after update');
    }
    return updated;
  }

  /**
   * Get credentials by ID
   */
  async getCredentialsById(
    credentialsId: string,
  ): Promise<RepositoryCredentials> {
    const credentials =
      await this.repositoryCredentialsRepository.findById(credentialsId);
    if (!credentials) {
      throw new NotFoundException('Credentials not found');
    }
    return credentials;
  }

  /**
   * Get all credentials for a repository
   */
  async getCredentialsByRepositoryId(
    repositoryId: string,
  ): Promise<RepositoryCredentials[]> {
    return await this.repositoryCredentialsRepository.findByRepositoryId(
      repositoryId,
    );
  }

  /**
   * Get active credentials for a repository
   */
  async getActiveCredentialsByRepositoryId(
    repositoryId: string,
  ): Promise<RepositoryCredentials[]> {
    return await this.repositoryCredentialsRepository.findActiveByRepositoryId(
      repositoryId,
    );
  }

  /**
   * Get default credentials for a repository
   */
  async getDefaultCredentials(
    repositoryId: string,
  ): Promise<RepositoryCredentials | null> {
    return await this.repositoryCredentialsRepository.findDefaultByRepositoryId(
      repositoryId,
    );
  }

  /**
   * Delete credentials (will cascade delete access entries)
   */
  async deleteCredentials(credentialsId: string): Promise<void> {
    const credentials =
      await this.repositoryCredentialsRepository.findById(credentialsId);
    if (!credentials) {
      throw new NotFoundException('Credentials not found');
    }

    await this.repositoryCredentialsRepository.delete(credentialsId);
  }

  /**
   * Deactivate credentials (soft delete)
   */
  async deactivateCredentials(
    credentialsId: string,
  ): Promise<RepositoryCredentials> {
    return await this.updateCredentials(credentialsId, { isActive: false });
  }

  /**
   * Activate credentials
   */
  async activateCredentials(
    credentialsId: string,
  ): Promise<RepositoryCredentials> {
    return await this.updateCredentials(credentialsId, { isActive: true });
  }
}
