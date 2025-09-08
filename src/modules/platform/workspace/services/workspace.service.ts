import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { Workspace } from '../../entities/workspace/workspace.entity';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { WorkspaceTransformer } from '../transformers/workspace.transformer';
import { CreateWorkspaceRequestDto } from '../dto/create-workspace-request.dto';
import { UpdateWorkspaceRequestDto } from '../dto/update-workspace-request.dto';
import { QueryFailedError } from 'typeorm';
import { TransactionManagerService } from '../../services/transaction-manager.service';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * Creates a new workspace
   * @param createWorkspaceDto The workspace creation data
   * @param ownerUserId The ID of the user creating the workspace
   * @returns The created workspace
   */
  async createWorkspace(
    createWorkspaceDto: CreateWorkspaceRequestDto, 
    ownerUserId: string
  ): Promise<Workspace> {
    const workspaceData = WorkspaceTransformer.createRequestDtoToEntity(createWorkspaceDto, ownerUserId);
    
    try {
      const repository = this.transactionManager.getRepository(Workspace);
      const workspace = await repository.save(workspaceData);
      
      this.logger.log(`Successfully created workspace ${workspace.id}`);
      return workspace;
    } catch (error) {
      if (this.isUniqueConstraintError(error, 'name_key')) {
        throw new BadRequestException({
          message: ['Workspace key already exists. Please choose a different key.'],
          error: 'Bad Request',
          statusCode: 400,
          property: 'name_key',
          constraints: {
            isUnique: 'Workspace key already exists. Please choose a different key.'
          }
        });
      }
      throw error;
    }
  }

  /**
   * Updates a workspace with KMS key ID
   * @param workspaceId The workspace ID
   * @param kmsKeyId The KMS key ID
   */
  async updateWorkspaceKmsKey(
    workspaceId: string, 
    kmsKeyId: string
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(Workspace);
    await repository.update(workspaceId, { kmsKeyId });
    this.logger.log(`Updated workspace ${workspaceId} with KMS key ${kmsKeyId}`);
  }

  async getWorkspaceById(id: string): Promise<Workspace> {
    const repository = this.transactionManager.getRepository(Workspace);
    const workspace = await repository.findOne({ 
      where: { id },
      relations: ['owner', 'members', 'repositories']
    });
    
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    
    return workspace;
  }

  async updateWorkspace(id: string, updateWorkspaceDto: UpdateWorkspaceRequestDto, currentUserId: string): Promise<Workspace> {
    const workspace = await this.getWorkspaceById(id);
    
    // Only owner can update workspace
    if (workspace.ownerUserId !== currentUserId) {
      throw new ForbiddenException('Only workspace owner can update workspace');
    }

    const updateData = WorkspaceTransformer.updateRequestDtoToEntity(updateWorkspaceDto);
    
    try {
      const repository = this.transactionManager.getRepository(Workspace);
      await repository.update(id, updateData);
    } catch (error) {
      if (this.isUniqueConstraintError(error, 'name_key')) {
        throw new BadRequestException({
          message: ['Workspace key already exists. Please choose a different key.'],
          error: 'Bad Request',
          statusCode: 400,
          property: 'name_key',
          constraints: {
            isUnique: 'Workspace key already exists. Please choose a different key.'
          }
        });
      }
      throw error;
    }
    
    return await this.getWorkspaceById(id);
  }

  async deleteWorkspace(id: string, currentUserId: string): Promise<void> {
    const workspace = await this.getWorkspaceById(id);
    
    // Only owner can delete workspace
    if (workspace.ownerUserId !== currentUserId) {
      throw new ForbiddenException('Only workspace owner can delete workspace');
    }

    const repository = this.transactionManager.getRepository(Workspace);
    await repository.delete(id);
  }

  async getWorkspacesByOwner(ownerUserId: string): Promise<Workspace[]> {
    const repository = this.transactionManager.getRepository(Workspace);
    return await repository.find({
      where: { ownerUserId },
      relations: ['repositories']
    });
  }

  async workspaceExists(id: string): Promise<boolean> {
    const repository = this.transactionManager.getRepository(Workspace);
    const count = await repository.count({ where: { id } });
    return count > 0;
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
