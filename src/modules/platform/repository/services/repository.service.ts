import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from '../../entities/repository/repository.entity';
import { RepositoryRepository } from '../repositories/repository.repository';
import { RepositoryTransformer } from '../transformers/repository.transformer';
import { CreateRepositoryRequestDto } from '../dto/create-repository-request.dto';
import { UpdateRepositoryRequestDto } from '../dto/update-repository-request.dto';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class RepositoryService {
  constructor(
    private readonly repositoryRepository: RepositoryRepository,
  ) {}

  async createRepository(createRepositoryDto: CreateRepositoryRequestDto, workspaceId: string): Promise<Repository> {
    const repositoryData = RepositoryTransformer.createRequestDtoToEntity(createRepositoryDto, workspaceId);
    
    try {
      return await this.repositoryRepository.createFromData(repositoryData);
    } catch (error) {
      if (this.isUniqueConstraintError(error, 'repositoryNameKey')) {
        throw new BadRequestException({
          message: ['Repository key already exists. Please choose a different key.'],
          error: 'Bad Request',
          statusCode: 400,
          property: 'repositoryNameKey',
          constraints: {
            isUnique: 'Repository key already exists. Please choose a different key.'
          }
        });
      }
      throw error;
    }
  }

  async getRepositoryById(id: string): Promise<Repository> {
    const repository = await this.repositoryRepository.findById(id);
    
    if (!repository) {
      throw new NotFoundException(`Repository with ID ${id} not found`);
    }
    
    return repository;
  }

  async getRepositoriesByWorkspace(workspaceId: string): Promise<Repository[]> {
    return await this.repositoryRepository.findByWorkspaceId(workspaceId);
  }

  async getRepositoriesByWorkspacePaginated(
    workspaceId: string,
    skip: number,
    take: number,
  ): Promise<[Repository[], number]> {
    return await this.repositoryRepository.findByWorkspaceIdPaginated(
      workspaceId,
      skip,
      take,
    );
  }

  async getRepositoriesByWorkspaceWithSearch(
    workspaceId: string,
    search?: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<[Repository[], number]> {
    return await this.repositoryRepository.findByWorkspaceIdWithSearch(
      workspaceId,
      search,
      skip,
      take,
    );
  }

  async getAllRepositoriesPaginated(
    skip: number,
    take: number,
  ): Promise<[Repository[], number]> {
    return await this.repositoryRepository.findAllPaginated(skip, take);
  }

  async updateRepository(id: string, updateRepositoryDto: UpdateRepositoryRequestDto): Promise<Repository> {
    const repository = await this.getRepositoryById(id);
    
    const updateData = RepositoryTransformer.updateRequestDtoToEntity(updateRepositoryDto);
    
    try {
      await this.repositoryRepository.updateWithData(id, updateData);
    } catch (error) {
      if (this.isUniqueConstraintError(error, 'repositoryNameKey')) {
        throw new BadRequestException({
          message: ['Repository key already exists. Please choose a different key.'],
          error: 'Bad Request',
          statusCode: 400,
          property: 'repositoryNameKey',
          constraints: {
            isUnique: 'Repository key already exists. Please choose a different key.'
          }
        });
      }
      throw error;
    }
    
    return await this.getRepositoryById(id);
  }

  async deleteRepository(id: string): Promise<void> {
    const repository = await this.getRepositoryById(id);
    await this.repositoryRepository.delete(id);
  }

  async repositoryExistsInWorkspace(
    repositoryId: string,
    workspaceId: string,
  ): Promise<boolean> {
    return await this.repositoryRepository.existsByIdAndWorkspaceId(
      repositoryId,
      workspaceId,
    );
  }

  async getRepositoryByIdAndWorkspaceId(
    repositoryId: string,
    workspaceId: string,
  ): Promise<Repository | null> {
    return await this.repositoryRepository.findByIdAndWorkspaceId(
      repositoryId,
      workspaceId,
    );
  }

  /**
   * Checks if the error is a unique constraint violation for a specific column
   */
  private isUniqueConstraintError(error: any, column: string): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    // Check for PostgreSQL unique constraint error
    if (error.driverError?.code === '23505' && error.driverError?.detail?.includes(column)) {
      return true;
    }

    // Check for MySQL unique constraint error
    if (error.driverError?.code === 'ER_DUP_ENTRY' && error.message?.includes(column)) {
      return true;
    }

    // Check for SQLite unique constraint error
    if (error.driverError?.code === 'SQLITE_CONSTRAINT_UNIQUE' && error.message?.includes(column)) {
      return true;
    }

    // Generic check for unique constraint message
    if (error.message?.toLowerCase().includes('unique') && error.message?.includes(column)) {
      return true;
    }

    return false;
  }
}
