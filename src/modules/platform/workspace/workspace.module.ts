import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from '../entities/workspace/workspace.entity';
import { Role } from '../entities/workspace/role.entity';
import { WorkspaceMember } from '../entities/workspace/workspace-member.entity';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { RoleRepository } from './repositories/role.repository';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository';
import { WorkspaceService } from './services/workspace.service';
import { RoleService } from './services/role.service';
import { WorkspaceMemberService } from './services/workspace-member.service';
import { WorkspaceMediaFacade } from './facades/workspace-media.facade';
import { WorkspaceMemberFacade } from './facades/workspace-member.facade';
import { WorkspaceProvider } from './providers/workspace.provider';
import { RoleProvider } from './providers/role.provider';
import { WorkspaceController } from './controllers/workspace.controller';
import { RoleController } from './controllers/management/role.controller';
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
    TypeOrmModule.forFeature([Workspace, Role, WorkspaceMember]),
    KeyManagementModule,
    forwardRef(() => AuthModule),
    forwardRef(() => RepositoryModule),
  ],
  providers: [
    WorkspaceRepository,
    RoleRepository,
    WorkspaceMemberRepository,
    WorkspaceService,
    RoleService,
    WorkspaceMemberService,
    WorkspaceMediaFacade,
    WorkspaceMemberFacade,
    WorkspaceProvider,
    RoleProvider,
    WorkspaceAbilityFactory,
    WorkspaceGuard,
    CaslPermissionHelper,
    WorkspaceValidationHelper,
  ],
  controllers: [WorkspaceController, RoleController],
  exports: [
    WorkspaceRepository,
    RoleRepository,
    WorkspaceMemberRepository,
    WorkspaceService,
    RoleService,
    WorkspaceMemberService,
    WorkspaceMediaFacade,
    WorkspaceMemberFacade,
    WorkspaceProvider,
    RoleProvider,
    WorkspaceAbilityFactory,
    WorkspaceGuard,
    CaslPermissionHelper,
    WorkspaceValidationHelper,
  ],
})
export class WorkspaceModule {}
