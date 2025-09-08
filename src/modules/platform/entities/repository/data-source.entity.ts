import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Repository } from './repository.entity';
import { DataSourceType } from '../enums/data-source-type.enum';
import { DataSourceChangeHistory } from './data-source-change-history.entity';

@Entity('data_sources')
export class DataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: DataSourceType,
  })
  type: DataSourceType;

  @Column('text')
  encryptedConfiguration: string;

  @Column()
  repositoryId: string;

  @ManyToOne(() => Repository, (repository) => repository.dataSources)
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @OneToMany(() => DataSourceChangeHistory, (changeHistory) => changeHistory.dataSource)
  changeHistory: DataSourceChangeHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
