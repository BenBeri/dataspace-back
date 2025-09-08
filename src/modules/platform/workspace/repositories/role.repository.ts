import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../entities/workspace/role.entity';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(Role)
    private readonly typeormRepository: Repository<Role>,
  ) {}

  get repository(): Repository<Role> {
    return this.typeormRepository;
  }
}
