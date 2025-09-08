import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { TRANSACTIONAL_KEY, TransactionalOptions } from '../decorators/transactional.decorator';
import { TransactionContext } from '../services/transaction-context.service';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @InjectDataSource()
    private dataSource: DataSource,
    private transactionContext: TransactionContext,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const transactionalOptions = this.reflector.getAllAndOverride<TransactionalOptions>(
      TRANSACTIONAL_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!transactionalOptions) {
      return next.handle();
    }

    // Check if we're already in a transaction
    if (this.transactionContext.isInTransaction()) {
      // Handle propagation logic
      if (transactionalOptions.propagation === 'REQUIRES_NEW') {
        // Create a new transaction even if one exists
        return this.executeInNewTransaction(next, transactionalOptions);
      } else if (transactionalOptions.propagation === 'NOT_SUPPORTED') {
        // Execute without transaction
        return next.handle();
      }
      // Default: REQUIRED - use existing transaction
      return next.handle();
    }

    // No existing transaction, create a new one
    return this.executeInNewTransaction(next, transactionalOptions);
  }

  private async executeInNewTransaction(
    next: CallHandler,
    options: TransactionalOptions,
  ): Promise<Observable<any>> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    await queryRunner.connect();
    
    if (options.isolation) {
      await queryRunner.startTransaction(options.isolation);
    } else {
      await queryRunner.startTransaction();
    }

    return new Observable((observer) => {
      // Set the transaction context
      this.transactionContext.setManager(queryRunner.manager);

      const subscription = next.handle().subscribe({
        next: async (value) => {
          try {
            await queryRunner.commitTransaction();
            observer.next(value);
            observer.complete();
          } catch (error) {
            await queryRunner.rollbackTransaction();
            observer.error(error);
          } finally {
            await queryRunner.release();
            this.transactionContext.clearManager();
          }
        },
        error: async (error) => {
          try {
            await queryRunner.rollbackTransaction();
          } catch (rollbackError) {
            console.error('Failed to rollback transaction:', rollbackError);
          } finally {
            await queryRunner.release();
            this.transactionContext.clearManager();
          }
          observer.error(error);
        },
      });

      return () => {
        subscription.unsubscribe();
      };
    });
  }
}
