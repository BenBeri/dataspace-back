/**
 * Abstract base entity for entities that have a unique name key
 * This provides a standardized approach to key naming across different entity types
 * Note: Concrete entities must define their own @Column decorator for nameKey
 */
export abstract class KeyNameEntity {
  nameKey: string;
}