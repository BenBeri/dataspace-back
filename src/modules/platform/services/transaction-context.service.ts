import { Injectable, Scope } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AsyncLocalStorage } from 'async_hooks';

interface TransactionStore {
  manager?: EntityManager;
}

@Injectable({ scope: Scope.DEFAULT })
export class TransactionContext {
  private static asyncLocalStorage = new AsyncLocalStorage<TransactionStore>();

  /**
   * Set the current transaction manager
   */
  setManager(manager: EntityManager): void {
    const store = TransactionContext.asyncLocalStorage.getStore() || {};
    store.manager = manager;
    TransactionContext.asyncLocalStorage.enterWith(store);
  }

  /**
   * Get the current transaction manager
   */
  getManager(): EntityManager | undefined {
    const store = TransactionContext.asyncLocalStorage.getStore();
    return store?.manager;
  }

  /**
   * Clear the current transaction manager
   */
  clearManager(): void {
    const store = TransactionContext.asyncLocalStorage.getStore();
    if (store) {
      delete store.manager;
    }
  }

  /**
   * Check if currently in a transaction
   */
  isInTransaction(): boolean {
    return !!this.getManager();
  }

  /**
   * Run a function within the current transaction context
   */
  runWithContext<T>(store: TransactionStore, fn: () => T): T {
    return TransactionContext.asyncLocalStorage.run(store, fn);
  }
}
