import {Global, Module} from '@nestjs/common';
import {APP_INTERCEPTOR} from '@nestjs/core';
import {TransactionHelper} from './helpers/transaction.helper';
import {TransactionContext} from './services/transaction-context.service';
import {TransactionManagerService} from './services/transaction-manager.service';
import {TransactionInterceptor} from '../interceptors/transaction.interceptor';
import {S3Service} from "./services/s3.service";

@Global()
@Module({
    providers: [
        TransactionHelper,
        TransactionContext,
        TransactionManagerService,
        S3Service,
        {
            provide: APP_INTERCEPTOR,
            useClass: TransactionInterceptor,
        },
    ],
    exports: [
        TransactionHelper,
        TransactionContext,
        TransactionManagerService,
        S3Service
    ],
})
export class SharedModule {
}
