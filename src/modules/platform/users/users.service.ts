import { Injectable, ConflictException } from '@nestjs/common';
import { User } from '../entities/user/user.entity';
import { UserRepository } from './repositories/user.repository';
import { UserTransformer } from './transformers/user.transformer';
import { CreateUserRequestDto } from './dto/create-user-request.dto';
import { UpdateUserRequestDto } from './dto/update-user-request.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { PasswordHashService } from './services/password-hash.service';
import { PasswordHashHelper } from './helpers/password-hash.helper';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHashService: PasswordHashService,
    private readonly passwordHashHelper: PasswordHashHelper,
  ) {}

  async createUser(createUserDto: CreateUserRequestDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException(`User with email ${createUserDto.email} already exists`);
    }

    // Generate salt and hash password
    const { salt, hash } = await this.passwordHashHelper.createPasswordHash(createUserDto.password);

    // Create user with salt
    const userData = UserTransformer.createRequestDtoToEntity(createUserDto, salt);
    const user = await this.userRepository.create(userData);

    // Create password hash entry
    await this.passwordHashService.createPasswordHash(user.id, hash);

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async getUsersWithFiltersAndPagination(query: GetUsersQueryDto): Promise<{ users: User[]; total: number }> {
    return await this.userRepository.findWithFiltersAndPagination(query);
  }

  async getUserById(id: string): Promise<User> {
    return await this.userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  async updateUser(id: string, updateUserDto: UpdateUserRequestDto): Promise<User> {
    // Ensure user exists before updating
    await this.userRepository.findById(id);
    
    // If email is being updated, check it doesn't conflict with existing user
    if (updateUserDto.email) {
      const existingUser = await this.userRepository.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(`User with email ${updateUserDto.email} already exists`);
      }
    }

    const userData = UserTransformer.updateRequestDtoToEntity(updateUserDto);
    return await this.userRepository.update(id, userData);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async userExists(id: string): Promise<boolean> {
    return await this.userRepository.exists(id);
  }
}
