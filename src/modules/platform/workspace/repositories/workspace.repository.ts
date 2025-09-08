import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../../entities/workspace/workspace.entity';

@Injectable()
export class WorkspaceRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly typeormRepository: Repository<Workspace>,
  ) {}

  get repository(): Repository<Workspace> {
    return this.typeormRepository;
  }
}
