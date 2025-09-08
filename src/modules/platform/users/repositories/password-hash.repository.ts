import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordHash } from '../../entities/user/password-hash.entity';

@Injectable()
export class PasswordHashRepository {
  constructor(
    @InjectRepository(PasswordHash)
    private readonly passwordHashRepository: Repository<PasswordHash>,
  ) {}

  async create(passwordHashData: Partial<PasswordHash>): Promise<PasswordHash> {
    const passwordHash = this.passwordHashRepository.create(passwordHashData);
    return await this.passwordHashRepository.save(passwordHash);
  }

  async findById(id: string): Promise<PasswordHash> {
    const passwordHash = await this.passwordHashRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!passwordHash) {
      throw new NotFoundException(`Password hash with ID ${id} not found`);
    }

    return passwordHash;
  }

  async findActiveByUserId(userId: string): Promise<PasswordHash | null> {
    return await this.passwordHashRepository.findOne({
      where: { userId, isActive: true },
      relations: ['user'],
    });
  }

  async findAllByUserId(userId: string): Promise<PasswordHash[]> {
    return await this.passwordHashRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async deactivateAllForUser(userId: string): Promise<void> {
    await this.passwordHashRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );
  }

  async update(id: string, passwordHashData: Partial<PasswordHash>): Promise<PasswordHash> {
    await this.findById(id); // Ensure it exists
    await this.passwordHashRepository.update(id, passwordHashData);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const passwordHash = await this.findById(id);
    await this.passwordHashRepository.remove(passwordHash);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.passwordHashRepository.count({ where: { id } });
    return count > 0;
  }
}
