import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Workspace } from './workspace.entity';
import { Group } from './group.entity';
import type { PartialWorkspacePermissions } from '../../auth/interfaces/workspace-permissions.interface';

@Entity('workspace_members')
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  workspaceId: string;

  @Column()
  groupId: string; // renamed from roleId

  @Column({ default: false })
  isAdmin: boolean;

  @Column('jsonb', { nullable: true })
  permissions?: PartialWorkspacePermissions; // User-specific permission overrides for THIS workspace

  @ManyToOne(() => User, (user) => user.workspaceMemberships)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Workspace, (workspace) => workspace.members)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'groupId' })
  group: Group; // renamed from role

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
