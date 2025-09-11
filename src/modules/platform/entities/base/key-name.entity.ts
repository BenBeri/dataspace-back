import { Column } from 'typeorm';

/**
 * Abstract base entity for entities that have a unique name key
 * This provides a standardized approach to key naming across different entity types
 */
export abstract class KeyNameEntity {
  @Column({ length: 32, unique: true })
  nameKey: string;
}