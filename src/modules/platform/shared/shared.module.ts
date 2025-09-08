import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransactionHelper } from '../helpers/transaction.helper';
import { TransactionContext } from '../services/transaction-context.service';
import { TransactionManagerService } from '../services/transaction-manager.service';
import { TransactionInterceptor } from '../interceptors/transaction.interceptor';

@Global()
@Module({
  providers: [
    TransactionHelper,
    TransactionContext,
    TransactionManagerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransactionInterceptor,
    },
  ],
  exports: [
    TransactionHelper,
    TransactionContext,
    TransactionManagerService,
  ],
})
export class SharedModule {}
