import { Injectable } from '@nestjs/common';
import { PasswordHash } from '../../entities/user/password-hash.entity';
import { PasswordHashRepository } from '../repositories/password-hash.repository';

@Injectable()
export class PasswordHashService {
  constructor(
    private readonly passwordHashRepository: PasswordHashRepository,
  ) {}

  async createPasswordHash(userId: string, hash: string): Promise<PasswordHash> {
    // Deactivate all existing password hashes for the user
    await this.passwordHashRepository.deactivateAllForUser(userId);

    // Create new active password hash
    const passwordHashData = {
      userId,
      hash,
      isActive: true,
    };

    return await this.passwordHashRepository.create(passwordHashData);
  }

  async getActivePasswordHash(userId: string): Promise<PasswordHash | null> {
    return await this.passwordHashRepository.findActiveByUserId(userId);
  }

  async getAllPasswordHashes(userId: string): Promise<PasswordHash[]> {
    return await this.passwordHashRepository.findAllByUserId(userId);
  }

  async deactivatePasswordHash(id: string): Promise<PasswordHash> {
    return await this.passwordHashRepository.update(id, { isActive: false });
  }

  async deletePasswordHash(id: string): Promise<void> {
    await this.passwordHashRepository.delete(id);
  }

  async passwordHashExists(id: string): Promise<boolean> {
    return await this.passwordHashRepository.exists(id);
  }
}
