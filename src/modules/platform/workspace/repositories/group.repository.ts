import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../../entities/workspace/group.entity';

@Injectable()
export class GroupRepository {
  constructor(
    @InjectRepository(Group)
    private readonly typeormRepository: Repository<Group>,
  ) {}

  get repository(): Repository<Group> {
    return this.typeormRepository;
  }
}
