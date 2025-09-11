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
import { KeyNameEntity } from '../base/key-name.entity';

@Entity('workspaces')
export class Workspace extends KeyNameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'name_key', length: 32, unique: true })
  declare nameKey: string;

  @Column()
  ownerUserId: string;

  @Column({ nullable: true })
  kmsKeyId: string;

  @Column({ nullable: true })
  description: string;

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
