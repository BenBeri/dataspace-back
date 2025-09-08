import { SetMetadata } from '@nestjs/common';

export const TRANSACTIONAL_KEY = Symbol('TRANSACTIONAL');

export interface TransactionalOptions {
  /**
   * Transaction isolation level
   */
  isolation?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  /**
   * Whether to propagate existing transactions or create new ones
   */
  propagation?: 'REQUIRED' | 'REQUIRES_NEW' | 'SUPPORTS' | 'NOT_SUPPORTED';
}

/**
 * Decorator to mark methods that should run within a database transaction
 * @param options Transaction configuration options
 */
export const Transactional = (options?: TransactionalOptions) => {
  return SetMetadata(TRANSACTIONAL_KEY, options || {});
};
