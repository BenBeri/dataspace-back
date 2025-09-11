import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Workspace } from '../../entities/workspace/workspace.entity';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { WorkspaceTransformer } from '../transformers/workspace.transformer';
import { CreateWorkspaceRequestDto } from '../dto/create-workspace-request.dto';
import { UpdateWorkspaceRequestDto } from '../dto/update-workspace-request.dto';
import { TransactionManagerService } from '../../shared/services/transaction-manager.service';
import { EntityKeyNameHelper } from '../../shared/helpers/entity-key-name.helper';

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
    // Generate a unique workspace key using efficient database checks
    const uniqueNameKey = await EntityKeyNameHelper.generateUniqueKeyAsync(
      createWorkspaceDto.name,
      (key: string) => this.workspaceRepository.keyExists(key)
    );
    
    // Create workspace data with the unique key
    const workspaceData = WorkspaceTransformer.createRequestDtoToEntity(createWorkspaceDto, ownerUserId, uniqueNameKey);
    
    const repository = this.transactionManager.getRepository(Workspace);
    const workspace = await repository.save(workspaceData);
    
    this.logger.log(`Successfully created workspace ${workspace.id} with key ${uniqueNameKey}`);
    return workspace;
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
    
    const repository = this.transactionManager.getRepository(Workspace);
    await repository.update(id, updateData);
    
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
   * Gets a workspace by name key without relations
   * @param nameKey The workspace name key
   * @returns The workspace without relations
   */
  async getWorkspaceByNameKey(nameKey: string): Promise<Workspace> {
    const repository = this.transactionManager.getRepository(Workspace);
    const workspace = await repository.findOne({ 
      where: { nameKey }
    });
    
    if (!workspace) {
      throw new NotFoundException(`Workspace with key ${nameKey} not found`);
    }
    
    return workspace;
  }

}
