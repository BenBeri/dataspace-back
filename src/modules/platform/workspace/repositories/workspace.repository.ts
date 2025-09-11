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

  /**
   * Checks if a workspace key exists
   * @param nameKey The workspace name key to check
   * @returns Boolean indicating if the key exists
   */
  async keyExists(nameKey: string): Promise<boolean> {
    const count = await this.typeormRepository.count({
      where: { nameKey },
    });
    return count > 0;
  }
}
