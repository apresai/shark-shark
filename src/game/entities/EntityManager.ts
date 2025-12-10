/**
 * EntityManager - Manages entity lifecycle and ID generation
 */

import { Entity, EntityType, GameState } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private entitiesToAdd: Entity[] = [];
  private entitiesToRemove: string[] = [];

  /**
   * Generate a unique entity ID
   */
  generateId(): string {
    return uuidv4();
  }

  /**
   * Add an entity to the manager
   */
  addEntity(entity: Entity): void {
    this.entitiesToAdd.push(entity);
  }

  /**
   * Remove an entity by ID
   */
  removeEntity(entityId: string): void {
    this.entitiesToRemove.push(entityId);
  }

  /**
   * Get an entity by ID
   */
  getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }

  /**
   * Get all entities of a specific type
   */
  getEntitiesByType(type: EntityType): Entity[] {
    return Array.from(this.entities.values()).filter(entity => entity.type === type);
  }

  /**
   * Get all active entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values()).filter(entity => entity.active);
  }

  /**
   * Update all entities
   */
  update(deltaTime: number, gameState: GameState): void {
    // Process additions
    for (const entity of this.entitiesToAdd) {
      this.entities.set(entity.id, entity);
    }
    this.entitiesToAdd.length = 0;

    // Process removals
    for (const entityId of this.entitiesToRemove) {
      this.entities.delete(entityId);
    }
    this.entitiesToRemove.length = 0;

    // Update all active entities
    for (const entity of this.entities.values()) {
      if (entity.active) {
        entity.update(deltaTime, gameState);
        
        // Auto-remove inactive entities
        if (!entity.active) {
          this.removeEntity(entity.id);
        }
      }
    }
  }

  /**
   * Render all entities
   */
  render(ctx: CanvasRenderingContext2D, interpolation: number): void {
    for (const entity of this.entities.values()) {
      if (entity.active) {
        entity.render(ctx, interpolation);
      }
    }
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear();
    this.entitiesToAdd.length = 0;
    this.entitiesToRemove.length = 0;
  }

  /**
   * Get entity count
   */
  getEntityCount(): number {
    return Array.from(this.entities.values()).filter(entity => entity.active).length;
  }

  /**
   * Get entity count by type
   */
  getEntityCountByType(type: EntityType): number {
    return this.getEntitiesByType(type).length;
  }
}