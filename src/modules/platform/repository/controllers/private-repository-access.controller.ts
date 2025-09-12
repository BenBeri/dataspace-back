import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserPrivateRepositoryService } from '../services/user-private-repository.service';
import { WorkspaceGuard } from '../../workspace/guards/workspace.guard';
import { CheckAbility } from '../../workspace/casl/decorators/check-ability.decorator';
import { RepositoryPermission } from '../../workspace/casl/permissions/repository-permission.enum';
import { UserPermission } from '../../workspace/casl/permissions/user-permission.enum';
import { Repository } from '../../entities/repository/repository.entity';
import { User } from '../../entities/user/user.entity';
import { GrantPrivateRepositoryAccessDto } from '../dto/grant-private-repository-access-request.dto';
import { UpdatePrivateRepositoryPermissionsDto } from '../dto/update-private-repository-permissions-request.dto';
import { PrivateRepositoryAccessResponseDto } from '../dto/private-repository-access-response.dto';

@Controller('workspaces/:workspaceId/repositories/:repositoryId/private-access')
@UseGuards(WorkspaceGuard)
export class PrivateRepositoryAccessController {
  constructor(
    private readonly userPrivateRepositoryService: UserPrivateRepositoryService,
  ) {}

  /**
   * Mission 1: Grant user access to private repository
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CheckAbility({ action: UserPermission.UPDATE, subject: User }) // Can manage users
  @CheckAbility({ action: RepositoryPermission.UPDATE, subject: Repository }) // Can manage repo
  async grantUserAccess(
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Body() grantAccessDto: GrantPrivateRepositoryAccessDto,
  ): Promise<PrivateRepositoryAccessResponseDto> {
    const access =
      await this.userPrivateRepositoryService.grantUserAccessToPrivateRepository(
        grantAccessDto.userId,
        repositoryId,
        grantAccessDto.permissions,
        grantAccessDto.accessReason,
      );

    return {
      id: access.id,
      userId: access.userId,
      repositoryId: access.repositoryId,
      permissions: access.permissions,
      accessReason: access.accessReason,
      createdAt: access.createdAt,
      updatedAt: access.updatedAt,
    };
  }

  /**
   * Mission 2: Get all users with access to this private repository
   */
  @Get()
  @CheckAbility({ action: RepositoryPermission.READ, subject: Repository })
  async getUsersWithAccess(
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
  ): Promise<PrivateRepositoryAccessResponseDto[]> {
    const access =
      await this.userPrivateRepositoryService.getUsersWithAccessToRepository(
        repositoryId,
      );

    return access.map((item) => ({
      id: item.userId, // Using userId as id for simplicity
      userId: item.userId,
      repositoryId: item.repositoryId,
      permissions: item.permissions,
      accessReason: item.accessReason,
      user: item.user,
      repository: item.repository,
      createdAt: new Date(), // You might want to add these fields to the interface
      updatedAt: new Date(),
    }));
  }

  /**
   * Update user's permissions for private repository
   */
  @Patch('users/:userId')
  @CheckAbility({ action: UserPermission.UPDATE, subject: User })
  @CheckAbility({ action: RepositoryPermission.UPDATE, subject: Repository })
  async updateUserPermissions(
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateDto: UpdatePrivateRepositoryPermissionsDto,
  ): Promise<PrivateRepositoryAccessResponseDto> {
    const access =
      await this.userPrivateRepositoryService.updateUserRepositoryPermissions(
        userId,
        repositoryId,
        updateDto.permissions,
      );

    return {
      id: access.id,
      userId: access.userId,
      repositoryId: access.repositoryId,
      permissions: access.permissions,
      accessReason: access.accessReason,
      createdAt: access.createdAt,
      updatedAt: access.updatedAt,
    };
  }

  /**
   * Revoke user's access to private repository
   */
  @Delete('users/:userId')
  @HttpCode(HttpStatus.OK)
  @CheckAbility({ action: UserPermission.UPDATE, subject: User })
  @CheckAbility({ action: RepositoryPermission.UPDATE, subject: Repository })
  async revokeUserAccess(
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<{ message: string }> {
    await this.userPrivateRepositoryService.revokeUserAccessToPrivateRepository(
      userId,
      repositoryId,
    );

    return {
      message:
        'User access to private repository has been revoked successfully',
    };
  }

  /**
   * Check if specific user has access to this private repository
   */
  @Get('users/:userId')
  @CheckAbility({ action: RepositoryPermission.READ, subject: Repository })
  async getUserAccess(
    @Param('repositoryId', ParseUUIDPipe) repositoryId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<PrivateRepositoryAccessResponseDto | { hasAccess: false }> {
    const access =
      await this.userPrivateRepositoryService.hasAccessToPrivateRepository(
        userId,
        repositoryId,
      );

    if (!access) {
      return { hasAccess: false };
    }

    return {
      id: access.id,
      userId: access.userId,
      repositoryId: access.repositoryId,
      permissions: access.permissions,
      accessReason: access.accessReason,
      createdAt: access.createdAt,
      updatedAt: access.updatedAt,
    };
  }
}
