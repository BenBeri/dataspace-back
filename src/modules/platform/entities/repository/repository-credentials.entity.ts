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
import { Repository } from './repository.entity';
import { CredentialsAccess } from './credentials-access.entity';

@Entity('repository_credentials')
@Unique(['repositoryId', 'name'])
export class RepositoryCredentials {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  repositoryId: string;

  @Column()
  name: string; // e.g., "full-access", "read-only", "analytics"

  @Column()
  description: string; // Human-readable description

  @Column('text')
  encryptedCredentials: string; // JSON with database connection details

  @Column({ default: false })
  isDefault: boolean; // Fallback credentials if no specific access found

  @Column({ default: true })
  isActive: boolean; // Can be used to disable credentials without deleting them

  @ManyToOne(() => Repository, (repository) => repository.credentials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'repositoryId' })
  repository: Repository;

  @OneToMany(
    () => CredentialsAccess,
    (credentialsAccess) => credentialsAccess.credentials,
    { cascade: true },
  )
  credentialsAccess: CredentialsAccess[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
