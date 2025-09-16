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
import { RepositoryCredentials } from './repository-credentials.entity';
import { AccessIdentityType } from '../enums/access-identity-type.enum';

@Entity('credentials_access')
@Unique(['credentialsId', 'identityType', 'identityId'])
export class CredentialsAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  credentialsId: string;

  @Column({
    type: 'enum',
    enum: AccessIdentityType,
  })
  identityType: AccessIdentityType; // 'user' | 'group' | 'default'

  @Column()
  identityId: string; // userId, groupId, or 'default'

  @Column({ nullable: true })
  grantedBy: string; // userId who granted this access

  @Column({ nullable: true })
  notes: string; // Optional notes about why access was granted

  @ManyToOne(
    () => RepositoryCredentials,
    (credentials) => credentials.credentialsAccess,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'credentialsId' })
  credentials: RepositoryCredentials;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
