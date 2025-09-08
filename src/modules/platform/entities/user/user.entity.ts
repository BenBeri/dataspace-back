import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkspaceMember } from '../workspace/workspace-member.entity';
import { PasswordHash } from './password-hash.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  salt: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => WorkspaceMember, (workspaceMember) => workspaceMember.user)
  workspaceMemberships: WorkspaceMember[];

  @OneToMany(() => PasswordHash, (passwordHash) => passwordHash.user)
  passwordHashes: PasswordHash[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
