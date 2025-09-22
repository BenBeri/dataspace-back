import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DataSource } from './data-source.entity';
import { User } from '../user/user.entity';
import { DataSourceType } from '../enums/data-source-type.enum';

@Entity('data_source_change_history')
export class DataSourceChangeHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dataSourceId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  previousName?: string;

  @Column({ nullable: true })
  newName?: string;

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

  @ManyToOne(() => DataSource, (dataSource) => dataSource.changeHistory)
  @JoinColumn({ name: 'dataSourceId' })
  dataSource: DataSource;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
