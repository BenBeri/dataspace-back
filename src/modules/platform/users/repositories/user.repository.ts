import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../../entities/user/user.entity';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly typeormRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.typeormRepository.create(userData);
    return await this.typeormRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.typeormRepository.find();
  }

  async findById(id: string): Promise<User> {
    const user = await this.typeormRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.typeormRepository.findOne({ where: { email } });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    await this.typeormRepository.update(id, userData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.typeormRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.typeormRepository.count({ where: { id } });
    return count > 0;
  }

  async findWithFiltersAndPagination(query: GetUsersQueryDto): Promise<{ users: User[]; total: number }> {
    const queryBuilder = this.typeormRepository.createQueryBuilder('user');

    // Apply filters
    this.applyFilters(queryBuilder, query);

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    if (query.offset !== undefined || query.limit !== undefined) {
      queryBuilder.skip(query.getSkip()).take(query.getTake());
    }

    // Execute query
    const users = await queryBuilder.getMany();

    return { users, total };
  }

  private applyFilters(queryBuilder: SelectQueryBuilder<User>, query: GetUsersQueryDto): void {
    // Email filter (exact match)
    if (query.email) {
      queryBuilder.andWhere('user.email = :email', { email: query.email });
    }

    // First name filter (partial match, case insensitive)
    if (query.firstName) {
      queryBuilder.andWhere('LOWER(user.firstName) LIKE LOWER(:firstName)', { 
        firstName: `%${query.firstName}%` 
      });
    }

    // Last name filter (partial match, case insensitive)
    if (query.lastName) {
      queryBuilder.andWhere('LOWER(user.lastName) LIKE LOWER(:lastName)', { 
        lastName: `%${query.lastName}%` 
      });
    }

    // Active status filter
    if (query.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    // Created date range filters
    if (query.createdAfter) {
      queryBuilder.andWhere('user.createdAt >= :createdAfter', { createdAfter: query.createdAfter });
    }

    if (query.createdBefore) {
      queryBuilder.andWhere('user.createdAt <= :createdBefore', { createdBefore: query.createdBefore });
    }

    // Updated date range filters
    if (query.updatedAfter) {
      queryBuilder.andWhere('user.updatedAt >= :updatedAfter', { updatedAfter: query.updatedAfter });
    }

    if (query.updatedBefore) {
      queryBuilder.andWhere('user.updatedAt <= :updatedBefore', { updatedBefore: query.updatedBefore });
    }

    // Global search across multiple fields
    if (query.search) {
      queryBuilder.andWhere(
        '(LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search))',
        { search: `%${query.search}%` }
      );
    }

    // Default ordering by creation date (newest first)
    queryBuilder.orderBy('user.createdAt', 'DESC');
  }
}
