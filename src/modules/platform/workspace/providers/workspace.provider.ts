import {Injectable, Logger, Inject} from '@nestjs/common';
import {WorkspaceService} from '../services/workspace.service';
import {WorkspaceMemberService} from '../services/workspace-member.service';
import {WorkspaceMemberFacade} from '../facades/workspace-member.facade';
import {WorkspaceTransformer} from '../transformers/workspace.transformer';
import {WorkspaceMemberTransformer} from '../transformers/workspace-member.transformer';
import {CreateWorkspaceRequestDto} from '../dto/create-workspace-request.dto';
import {UpdateWorkspaceRequestDto} from '../dto/update-workspace-request.dto';
import {AddMemberRequestDto} from '../dto/add-member-request.dto';
import {UpdateMemberRoleRequestDto} from '../dto/update-member-role-request.dto';
import {WorkspaceResponseDto} from '../dto/workspace-response.dto';
import {WorkspaceMemberResponseDto} from '../dto/workspace-member-response.dto';
import {MyWorkspaceResponseDto} from '../dto/my-workspace-response.dto';
import type {IKeyManagementService} from '../../key-management/interfaces/key-management.interface';
import {KEY_MANAGEMENT_SERVICE} from '../../key-management/key-management.module';
import {Transactional} from '../../decorators/transactional.decorator';

@Injectable()
export class WorkspaceProvider {
    private readonly logger = new Logger(WorkspaceProvider.name);

    constructor(
        private readonly workspaceService: WorkspaceService,
        private readonly workspaceMemberService: WorkspaceMemberService,
        private readonly workspaceMemberFacade: WorkspaceMemberFacade,
        @Inject(KEY_MANAGEMENT_SERVICE)
        private readonly keyManagementService: IKeyManagementService,
    ) {
    }

    @Transactional({ isolation: 'READ COMMITTED' })
    async createWorkspace(createWorkspaceDto: CreateWorkspaceRequestDto, ownerUserId: string): Promise<WorkspaceResponseDto> {
        // All operations within this method will automatically run in a transaction
        // The TransactionManagerService will provide the correct EntityManager

        // 1. Create the workspace (owner automatically gets all permissions)
        const workspace = await this.workspaceService.createWorkspace(
            createWorkspaceDto,
            ownerUserId
        );

        // 2. Create encryption key for the workspace
        try {
            const keyId = await this.keyManagementService.createKey(workspace.id, {
                WorkspaceName: workspace.name,
                OwnerUserId: ownerUserId,
            });

            // Update workspace with key ID
            await this.workspaceService.updateWorkspaceKmsKey(
                workspace.id,
                keyId
            );

            workspace.kmsKeyId = keyId;
            this.logger.log(`Successfully created workspace ${workspace.id} with encryption key ${keyId}`);
        } catch (keyError) {
            // If key creation is critical, you can throw the error to rollback the transaction
            this.logger.error(`Failed to create encryption key for workspace ${workspace.id}: ${keyError.message}`);
            throw new Error(`Failed to create workspace encryption key: ${keyError.message}`);
        }

        return WorkspaceTransformer.toResponseDto(workspace);
    }

    async getWorkspaceById(id: string): Promise<WorkspaceResponseDto> {
        const workspace = await this.workspaceService.getWorkspaceById(id);
        return WorkspaceTransformer.toResponseDto(workspace);
    }

    async updateWorkspace(id: string, updateWorkspaceDto: UpdateWorkspaceRequestDto, currentUserId: string): Promise<WorkspaceResponseDto> {
        const workspace = await this.workspaceService.updateWorkspace(id, updateWorkspaceDto, currentUserId);
        return WorkspaceTransformer.toResponseDto(workspace);
    }

    async deleteWorkspace(id: string, currentUserId: string): Promise<{ message: string }> {
        await this.workspaceService.deleteWorkspace(id, currentUserId);
        return {message: 'Workspace successfully deleted'};
    }

    async addMemberToWorkspace(workspaceId: string, addMemberDto: AddMemberRequestDto, currentUserId: string): Promise<WorkspaceMemberResponseDto> {
        return await this.workspaceMemberFacade.addMemberToWorkspace(workspaceId, addMemberDto, currentUserId);
    }

    async updateMemberRole(workspaceId: string, userId: string, updateMemberRoleDto: UpdateMemberRoleRequestDto, currentUserId: string): Promise<WorkspaceMemberResponseDto> {
        return await this.workspaceMemberFacade.updateMemberRole(workspaceId, userId, updateMemberRoleDto, currentUserId);
    }

    async removeMemberFromWorkspace(workspaceId: string, userId: string, currentUserId: string): Promise<{
        message: string
    }> {
        return await this.workspaceMemberFacade.removeMemberFromWorkspace(workspaceId, userId, currentUserId);
    }

    async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberResponseDto[]> {
        return await this.workspaceMemberFacade.getWorkspaceMembers(workspaceId);
    }

    async getCurrentUserWorkspaces(userId: string): Promise<MyWorkspaceResponseDto[]> {
        // Get both workspaces where user is owner AND where user is a member
        const [ownedWorkspaces, memberWorkspaces] = await Promise.all([
            this.workspaceService.getWorkspacesByOwner(userId),
            this.workspaceMemberService.getUserWorkspaces(userId)
        ]);

        // Convert owned workspaces to MyWorkspaceResponseDto format
        const ownedWorkspaceResponses: MyWorkspaceResponseDto[] = ownedWorkspaces.map(workspace => ({
            workspaceId: workspace.id,
            nameKey: workspace.name_key,
            ownerUserId: workspace.ownerUserId,
            role: {
                name: 'Owner',
                permissions: {}, // Owner has all permissions by default
            },
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
        }));

        // Convert member workspaces using existing transformer
        const memberWorkspaceResponses = WorkspaceMemberTransformer.toMyWorkspaceResponseDtoArray(memberWorkspaces);

        // Combine and remove duplicates (in case owner is also added as member)
        const allWorkspaces = [...ownedWorkspaceResponses];
        const ownedWorkspaceIds = new Set(ownedWorkspaces.map(w => w.id));
        
        memberWorkspaceResponses.forEach(memberWorkspace => {
            if (!ownedWorkspaceIds.has(memberWorkspace.workspaceId)) {
                allWorkspaces.push(memberWorkspace);
            }
        });

        return allWorkspaces;
    }

    async getCurrentUserWorkspacesDetailed(userId: string): Promise<WorkspaceMemberResponseDto[]> {
        return await this.workspaceMemberFacade.getUserWorkspaces(userId);
    }

    async getUserWorkspaces(userId: string): Promise<WorkspaceMemberResponseDto[]> {
        return await this.workspaceMemberFacade.getUserWorkspaces(userId);
    }

    async getWorkspacesByOwner(ownerUserId: string): Promise<WorkspaceResponseDto[]> {
        const workspaces = await this.workspaceService.getWorkspacesByOwner(ownerUserId);
        return WorkspaceTransformer.toResponseDtoArray(workspaces);
    }
}
