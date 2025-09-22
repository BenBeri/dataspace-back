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
import { DataSourceType } from '../enums/data-source-type.enum';
import { KeyNameEntity } from '../base/key-name.entity';

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
