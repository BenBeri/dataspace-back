import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
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

  @OneToMany(() => DataSource, (dataSource) => dataSource.repository)
  dataSources: DataSource[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
