import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Repository } from './repository.entity';

@Entity('user_private_repositories')
@Unique(['userId', 'repositoryId']) // Prevent duplicate entries
export class UserPrivateRepository {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  repositoryId: string;

  @Column('jsonb')
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };

  @Column({ default: 'invited' })
  accessReason: 'invited' | 'owner' | 'admin';

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Repository)
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
