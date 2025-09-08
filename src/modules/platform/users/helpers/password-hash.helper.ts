import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class PasswordHashHelper {
  private readonly saltRounds = 12;

  /**
   * Generates a random salt for the user
   */
  generateSalt(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Hashes a raw password with the provided salt
   */
  async hashPassword(rawPassword: string, salt: string): Promise<string> {
    const saltedPassword = rawPassword + salt;
    return await bcrypt.hash(saltedPassword, this.saltRounds);
  }

  /**
   * Verifies a raw password against a hash using the provided salt
   */
  async verifyPassword(rawPassword: string, salt: string, hash: string): Promise<boolean> {
    const saltedPassword = rawPassword + salt;
    return await bcrypt.compare(saltedPassword, hash);
  }

  /**
   * Creates a complete password hash from a raw password
   * Returns both the salt and the hash
   */
  async createPasswordHash(rawPassword: string): Promise<{ salt: string; hash: string }> {
    const salt = this.generateSalt();
    const hash = await this.hashPassword(rawPassword, salt);
    
    return {
      salt,
      hash,
    };
  }
}
