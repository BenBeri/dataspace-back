import { Module } from '@nestjs/common';
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
import { WorkspaceMemberFacade } from './facades/workspace-member.facade';
import { WorkspaceProvider } from './providers/workspace.provider';
import { RoleProvider } from './providers/role.provider';
import { WorkspaceController } from './workspace.controller';
import { RoleController } from './role.controller';
import { KeyManagementModule } from '../key-management/key-management.module';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, Role, WorkspaceMember]), KeyManagementModule],
  providers: [
    WorkspaceRepository,
    RoleRepository,
    WorkspaceMemberRepository,
    WorkspaceService,
    RoleService,
    WorkspaceMemberService,
    WorkspaceMemberFacade,
    WorkspaceProvider,
    RoleProvider,
  ],
  controllers: [WorkspaceController, RoleController],
  exports: [
    WorkspaceRepository,
    RoleRepository,
    WorkspaceMemberRepository,
    WorkspaceService,
    RoleService,
    WorkspaceMemberService,
    WorkspaceMemberFacade,
    WorkspaceProvider,
    RoleProvider,
  ],
})
export class WorkspaceModule {}
