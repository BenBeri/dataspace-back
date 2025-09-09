import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository, ObjectLiteral, EntityTarget } from 'typeorm';
import { TransactionContext } from './transaction-context.service';

@Injectable()
export class TransactionManagerService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private transactionContext: TransactionContext,
  ) {}

  /**
   * Get the current entity manager (either from transaction or default)
   */
  getManager(): EntityManager {
    const transactionManager = this.transactionContext.getManager();
    return transactionManager || this.dataSource.manager;
  }

  /**
   * Get a repository with the current transaction manager
   */
  getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    return this.getManager().getRepository(entity);
  }

  /**
   * Check if currently running in a transaction
   */
  isInTransaction(): boolean {
    return this.transactionContext.isInTransaction();
  }
}
