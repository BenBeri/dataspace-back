import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Workspace } from '../workspace/workspace.entity';
import { DataSource } from './data-source.entity';

@Entity('repositories')
@Unique(['workspaceId', 'repositoryNameKey'])
export class Repository {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ length: 32 })
  repositoryNameKey: string;

  @Column()
  description: string;

  @Column()
  workspaceId: string;

  @Column({ default: false })
  isPrivate: boolean;

  @ManyToOne(() => Workspace, (workspace) => workspace.repositories)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @OneToOne(() => DataSource, (dataSource) => dataSource.repository)
  dataSource: DataSource;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
