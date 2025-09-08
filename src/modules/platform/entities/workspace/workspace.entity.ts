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
import { User } from '../user/user.entity';
import { Repository } from '../repository/repository.entity';
import { WorkspaceMember } from './workspace-member.entity';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ length: 32, unique: true })
  name_key: string;

  @Column()
  ownerUserId: string;

  @Column({ nullable: true })
  kmsKeyId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerUserId' })
  owner: User;

  @OneToMany(() => Repository, (repository) => repository.workspace)
  repositories: Repository[];

  @OneToMany(() => WorkspaceMember, (workspaceMember) => workspaceMember.workspace)
  members: WorkspaceMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
