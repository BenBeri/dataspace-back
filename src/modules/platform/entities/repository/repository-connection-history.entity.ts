import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Repository } from './repository.entity';
import { User } from '../user/user.entity';
import { DataSourceType } from '../enums/data-source-type.enum';

@Entity('repository_connection_history')
export class RepositoryConnectionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  repositoryId: string;

  @Column()
  userId: string;

  @Column({ nullable: true, type: 'varchar' })
  previousConnectionName?: string | null;

  @Column({ nullable: true, type: 'varchar' })
  newConnectionName?: string | null;

  @Column({
    type: 'enum',
    enum: DataSourceType,
    nullable: true,
  })
  previousType?: DataSourceType;

  @Column({
    type: 'enum',
    enum: DataSourceType,
    nullable: true,
  })
  newType?: DataSourceType;

  @Column({ nullable: true })
  configurationChanged?: boolean;

  @Column()
  changeDescription: string;

  @ManyToOne(() => Repository, (repository) => repository.connectionHistory)
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
