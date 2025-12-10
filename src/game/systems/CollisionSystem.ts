/**
 * Collision System for Shark Shark
 * Handles AABB collision detection and collision resolution
 */

import { 
  Entity, 
  PlayerState, 
  BoundingBox, 
  CollisionResult, 
  FishEntity,
  SeahorseEntity
} from '@/game/types';
import { FISH_POINTS, SHARK_CONFIG, SEAHORSE_CONFIG } from '@/game/constants';
import { Shark } from '@/game/entities/Shark';

/**
 * Collision System class for handling entity collisions
 */
export class CollisionSystem {
  /**
   * Check if two bounding boxes intersect (AABB collision detection)
   * @param boxA First bounding box
   * @param boxB Second bounding box
   * @returns True if boxes intersect
   */
  static intersects(boxA: BoundingBox, boxB: BoundingBox): boolean {
    return (
      boxA.x < boxB.x + boxB.width &&
      boxA.x + boxA.width > boxB.x &&
      boxA.y < boxB.y + boxB.height &&
      boxA.y + boxA.height > boxB.y
    );
  }

  /**
   * Get bounding box for player entity
   * @param player Player state
   * @returns Bounding box for collision detection
   */
  static getPlayerBoundingBox(player: PlayerState): BoundingBox {
    return {
      x: player.position.x - player.width / 2,
      y: player.position.y - player.height / 2,
      width: player.width,
      height: player.height,
    };
  }

  /**
   * Get bounding box for any entity (handles both class instances and plain objects)
   */
  static getEntityBoundingBox(entity: Entity): BoundingBox {
    // If entity has getBoundingBox method, use it
    if (typeof entity.getBoundingBox === 'function') {
      return entity.getBoundingBox();
    }
    // Otherwise, calculate from position and dimensions
    return {
      x: entity.position.x - entity.width / 2,
      y: entity.position.y - entity.height / 2,
      width: entity.width,
      height: entity.height,
    };
  }

  /**
   * Check collisions between player and all entities
   * @param player Current player state
   * @param entities Array of entities to check against
   * @returns Array of collision results
   */
  static checkCollisions(player: PlayerState, entities: Entity[]): CollisionResult[] {
    const collisions: CollisionResult[] = [];
    const playerBox = this.getPlayerBoundingBox(player);

    for (const entity of entities) {
      if (!entity.active) continue;

      const entityBox = this.getEntityBoundingBox(entity);
      
      if (this.intersects(playerBox, entityBox)) {
        const collision = this.resolveCollision(player, entity);
        if (collision) {
          collisions.push(collision);
        }
      }
    }

    return collisions;
  }

  /**
   * Resolve collision between player and entity
   * @param player Player state
   * @param entity Entity that collided with player
   * @returns Collision result or null if no collision should occur
   */
  static resolveCollision(player: PlayerState, entity: Entity): CollisionResult | null {
    // Skip death collisions if player is invulnerable
    if (player.invulnerable && this.wouldCauseDeath(player, entity)) {
      return null;
    }

    switch (entity.type) {
      case 'fish':
        return this.resolveFishCollision(player, entity as FishEntity);
      
      case 'shark':
        return this.resolveSharkCollision(player, entity as Shark);
      
      case 'crab':
      case 'jellyfish':
        return this.resolveHazardCollision(player, entity);
      
      case 'seahorse':
        return this.resolveSeahorseCollision(player, entity as SeahorseEntity);
      
      default:
        return null;
    }
  }

  /**
   * Resolve collision with fish entity
   * @param player Player state
   * @param fish Fish entity
   * @returns Collision result
   */
  static resolveFishCollision(player: PlayerState, fish: FishEntity): CollisionResult {
    // Determine eat vs death based on size comparison
    if (player.width > fish.width) {
      // Player eats fish - calculate points with tier multiplier
      const points = FISH_POINTS[fish.size] * player.tier;
      return {
        type: 'eat',
        entityA: { ...player } as unknown as Entity, // Convert PlayerState to Entity-like for interface
        entityB: fish,
        points,
      };
    } else {
      // Fish kills player
      return {
        type: 'death',
        entityA: { ...player } as unknown as Entity,
        entityB: fish,
      };
    }
  }

  /**
   * Resolve collision with shark entity
   * @param player Player state
   * @param shark Shark entity
   * @returns Collision result
   */
  static resolveSharkCollision(player: PlayerState, shark: Shark): CollisionResult {
    const playerBox = this.getPlayerBoundingBox(player);
    
    // Check collision with tail hitbox first (higher priority for points)
    const tailHitbox = shark.getTailHitbox();
    if (this.intersects(playerBox, tailHitbox)) {
      // Player bit shark tail - award points, shark continues
      return {
        type: 'shark_tail',
        entityA: { ...player } as unknown as Entity,
        entityB: shark,
        points: SHARK_CONFIG.tailPoints,
      };
    }
    
    // Check collision with body hitbox
    const bodyHitbox = shark.getBodyHitbox();
    if (this.intersects(playerBox, bodyHitbox)) {
      // Player hit shark body - death
      return {
        type: 'death',
        entityA: { ...player } as unknown as Entity,
        entityB: shark,
      };
    }
    
    // This shouldn't happen if we got here from a collision check,
    // but return death as fallback
    return {
      type: 'death',
      entityA: { ...player } as unknown as Entity,
      entityB: shark,
    };
  }

  /**
   * Resolve collision with hazard entities (crab, jellyfish)
   * @param player Player state
   * @param hazard Hazard entity
   * @returns Collision result
   */
  static resolveHazardCollision(player: PlayerState, hazard: Entity): CollisionResult {
    // Hazards are always lethal regardless of player tier
    return {
      type: 'hazard',
      entityA: { ...player } as unknown as Entity,
      entityB: hazard,
    };
  }

  /**
   * Resolve collision with seahorse entity
   * @param player Player state
   * @param seahorse Seahorse entity
   * @returns Collision result
   */
  static resolveSeahorseCollision(player: PlayerState, seahorse: SeahorseEntity): CollisionResult {
    return {
      type: 'bonus',
      entityA: { ...player } as unknown as Entity,
      entityB: seahorse,
      points: SEAHORSE_CONFIG.points,
    };
  }

  /**
   * Check if collision with entity would cause death (for invulnerability check)
   * @param player Player state
   * @param entity Entity to check
   * @returns True if collision would cause death
   */
  static wouldCauseDeath(player: PlayerState, entity: Entity): boolean {
    switch (entity.type) {
      case 'fish':
        // Death if fish is same size or larger
        return player.width <= entity.width;
      
      case 'shark':
        // Death if hitting shark body (not tail)
        // For simplicity in invulnerability check, assume body hit
        return true;
      
      case 'crab':
      case 'jellyfish':
        // Hazards always cause death
        return true;
      
      case 'seahorse':
        // Seahorses never cause death
        return false;
      
      default:
        return false;
    }
  }
}