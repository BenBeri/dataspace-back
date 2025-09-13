import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from '../entities/workspace/workspace.entity';
import { Group } from '../entities/workspace/group.entity';
import { WorkspaceMember } from '../entities/workspace/workspace-member.entity';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { GroupRepository } from './repositories/group.repository';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository';
import { WorkspaceService } from './services/workspace.service';
import { GroupService } from './services/group.service';
import { WorkspaceMemberService } from './services/workspace-member.service';
import { WorkspaceMediaFacade } from './facades/workspace-media.facade';
import { WorkspaceMemberFacade } from './facades/workspace-member.facade';
import { RepositoryPermissionFacade } from './facades/repository-permission.facade';
import { WorkspaceProvider } from './providers/workspace.provider';
import { GroupProvider } from './providers/group.provider';
import { WorkspaceController } from './controllers/workspace.controller';
import { GroupController } from './controllers/management/group.controller';
import { KeyManagementModule } from '../key-management/key-management.module';
import { S3Service } from '../shared/services/s3.service';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceAbilityFactory } from './casl/workspace-ability.factory';
import { WorkspaceGuard } from './guards/workspace.guard';
import { CaslPermissionHelper } from './helpers/casl-permission.helper';
import { WorkspaceValidationHelper } from './helpers/workspace-validation.helper';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, Group, WorkspaceMember]),
    KeyManagementModule,
    forwardRef(() => AuthModule),
    forwardRef(() => RepositoryModule),
  ],
  providers: [
    WorkspaceRepository,
    GroupRepository,
    WorkspaceMemberRepository,
    WorkspaceService,
    GroupService,
    WorkspaceMemberService,
    WorkspaceMediaFacade,
    WorkspaceMemberFacade,
    RepositoryPermissionFacade,
    WorkspaceProvider,
    GroupProvider,
    WorkspaceAbilityFactory,
    WorkspaceGuard,
    CaslPermissionHelper,
    WorkspaceValidationHelper,
  ],
  controllers: [WorkspaceController, GroupController],
  exports: [
    WorkspaceRepository,
    GroupRepository,
    WorkspaceMemberRepository,
    WorkspaceService,
    GroupService,
    WorkspaceMemberService,
    WorkspaceMediaFacade,
    WorkspaceMemberFacade,
    RepositoryPermissionFacade,
    WorkspaceProvider,
    GroupProvider,
    WorkspaceAbilityFactory,
    WorkspaceGuard,
    CaslPermissionHelper,
    WorkspaceValidationHelper,
  ],
})
export class WorkspaceModule {}
