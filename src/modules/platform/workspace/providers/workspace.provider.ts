import {Injectable, Logger, Inject} from '@nestjs/common';
import {WorkspaceService} from '../services/workspace.service';
import {WorkspaceMemberService} from '../services/workspace-member.service';
import {RoleService} from '../services/role.service';
import {WorkspaceMediaFacade} from '../facades/workspace-media.facade';
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
        private readonly roleService: RoleService,
        private readonly workspaceMediaFacade: WorkspaceMediaFacade,
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

        // 3. Create roles for the workspace
        try {
            const roles = await this.roleService.createDefaultRoles(workspace.id, createWorkspaceDto.roles);
            const adminRole = roles.find(role => role.name === 'admin');
            
            if (!adminRole) {
                throw new Error('Admin role was not created properly');
            }

            // 4. Assign the workspace creator to the admin role
            await this.workspaceMemberService.addMemberToWorkspace(
                workspace.id,
                ownerUserId,
                adminRole.id
            );

            this.logger.log(`Successfully created roles and assigned owner to admin role for workspace ${workspace.id}`);
        } catch (roleError) {
            this.logger.error(`Failed to create roles or assign owner for workspace ${workspace.id}: ${roleError.message}`);
            throw new Error(`Failed to setup workspace roles: ${roleError.message}`);
        }

        return await this.enrichWithLogoUrl(WorkspaceTransformer.toResponseDto(workspace));
    }

    async getWorkspaceById(id: string): Promise<WorkspaceResponseDto> {
        const workspace = await this.workspaceService.getWorkspaceById(id);
        return await this.enrichWithLogoUrl(WorkspaceTransformer.toResponseDto(workspace));
    }

    async updateWorkspace(id: string, updateWorkspaceDto: UpdateWorkspaceRequestDto, currentUserId: string): Promise<WorkspaceResponseDto> {
        const workspace = await this.workspaceService.updateWorkspace(id, updateWorkspaceDto, currentUserId);
        return await this.enrichWithLogoUrl(WorkspaceTransformer.toResponseDto(workspace));
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
        const ownedWorkspaceResponses: MyWorkspaceResponseDto[] = await Promise.all(
            ownedWorkspaces.map(async workspace => {
                const logoUrl = await this.workspaceMediaFacade.getWorkspaceLogoUrl(workspace.id);
                return {
                    workspaceId: workspace.id,
                    nameKey: workspace.name_key,
                    ownerUserId: workspace.ownerUserId,
                    role: {
                        name: 'Owner',
                        permissions: {}, // Owner has all permissions by default
                    },
                    createdAt: workspace.createdAt,
                    updatedAt: workspace.updatedAt,
                    logoUrl,
                };
            })
        );

        // Convert member workspaces using existing transformer and add logo URLs
        const memberWorkspaceResponsesWithoutLogo = WorkspaceMemberTransformer.toMyWorkspaceResponseDtoArray(memberWorkspaces);
        const memberWorkspaceResponses = await Promise.all(
            memberWorkspaceResponsesWithoutLogo.map(async memberWorkspace => {
                const logoUrl = await this.workspaceMediaFacade.getWorkspaceLogoUrl(memberWorkspace.workspaceId);
                return {
                    ...memberWorkspace,
                    logoUrl,
                };
            })
        );

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
        const responseArray = WorkspaceTransformer.toResponseDtoArray(workspaces);
        return await this.enrichArrayWithLogoUrl(responseArray);
    }

    /**
     * Set workspace logo
     * @param workspaceId - The workspace ID
     * @param logoBuffer - The logo image buffer
     * @param mimeType - The MIME type of the image
     */
    async setWorkspaceLogo(workspaceId: string, logoBuffer: Buffer, mimeType: string): Promise<void> {
        await this.workspaceMediaFacade.setWorkspaceLogo(workspaceId, logoBuffer, mimeType);
    }

    /**
     * Delete workspace logo
     * @param workspaceId - The workspace ID
     */
    async deleteWorkspaceLogo(workspaceId: string): Promise<{ message: string }> {
        await this.workspaceMediaFacade.deleteWorkspaceLogo(workspaceId);
        return { message: 'Workspace logo successfully deleted' };
    }

    /**
     * Enrich single workspace response with logo URL
     * @param workspaceResponse - Workspace response DTO
     */
    private async enrichWithLogoUrl(workspaceResponse: WorkspaceResponseDto): Promise<WorkspaceResponseDto> {
        const logoUrl = await this.workspaceMediaFacade.getWorkspaceLogoUrl(workspaceResponse.id);
        return {
            ...workspaceResponse,
            logoUrl,
        };
    }

    /**
     * Enrich array of workspace responses with logo URLs
     * @param workspaceResponses - Array of workspace response DTOs
     */
    private async enrichArrayWithLogoUrl(workspaceResponses: WorkspaceResponseDto[]): Promise<WorkspaceResponseDto[]> {
        return await Promise.all(
            workspaceResponses.map(async (workspace) => await this.enrichWithLogoUrl(workspace))
        );
    }
}
