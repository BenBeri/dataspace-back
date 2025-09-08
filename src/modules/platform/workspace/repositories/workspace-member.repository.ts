import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember } from '../../entities/workspace/workspace-member.entity';

@Injectable()
export class WorkspaceMemberRepository {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly typeormRepository: Repository<WorkspaceMember>,
  ) {}

  get repository(): Repository<WorkspaceMember> {
    return this.typeormRepository;
  }
}
