import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Repository } from './repository.entity';

@Entity('repository_metadata')
export class RepositoryMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  repositoryId: string;

  @Column({ default: false })
  isPrivate: boolean;

  @Column({ default: false })
  isSaved: boolean;

  @OneToOne(() => Repository, (repository) => repository.metadata, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
