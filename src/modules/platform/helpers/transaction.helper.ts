import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

export interface TransactionContext {
  manager: EntityManager;
}

@Injectable()
export class TransactionHelper {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Execute operations within a database transaction
   * @param work Function that performs the transactional work
   * @returns The result of the work function
   * @throws Rolls back the transaction if any error occurs
   */
  async runInTransaction<T>(
    work: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const result = await work({
        manager: queryRunner.manager,
      });
      
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Execute multiple operations within a database transaction with isolation level
   * @param isolationLevel The transaction isolation level
   * @param work Function that performs the transactional work
   * @returns The result of the work function
   */
  async runInTransactionWithIsolation<T>(
    isolationLevel: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE',
    work: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    await queryRunner.startTransaction(isolationLevel);
    
    try {
      const result = await work({
        manager: queryRunner.manager,
      });
      
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
