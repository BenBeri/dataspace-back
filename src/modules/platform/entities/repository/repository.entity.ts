import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Workspace } from '../workspace/workspace.entity';
import { DataSourceType } from '../enums/data-source-type.enum';
import { KeyNameEntity } from '../base/key-name.entity';
import { RepositoryConnectionHistory } from './repository-connection-history.entity';
import { RepositoryCredentials } from './repository-credentials.entity';
import { RepositoryMetadata } from './repository-metadata.entity';

@Entity('repositories')
@Unique(['workspaceId', 'nameKey'])
export class Repository extends KeyNameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: DataSourceType,
  })
  type: DataSourceType;

  @Column()
  workspaceId: string;

  @ManyToOne(() => Workspace, (workspace) => workspace.repositories)
  @JoinColumn({ name: 'workspaceId' })
  workspace: Workspace;

  @OneToMany(
    () => RepositoryConnectionHistory,
    (connectionHistory) => connectionHistory.repository,
  )
  connectionHistory: RepositoryConnectionHistory[];

  @OneToMany(
    () => RepositoryCredentials,
    (credentials) => credentials.repository,
  )
  credentials: RepositoryCredentials[];

  @OneToOne(() => RepositoryMetadata, (metadata) => metadata.repository, {
    cascade: true,
  })
  metadata: RepositoryMetadata;

  // Virtual getters for CASL compatibility
  get isPrivate(): boolean {
    return this.metadata?.isPrivate || false;
  }

  get isSaved(): boolean {
    return this.metadata?.isSaved || false;
  }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
