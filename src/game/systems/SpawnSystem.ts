/**
 * Spawn System
 * Manages spawning of fish and other entities based on difficulty and timing
 */

import { Entity, FishSize, GameState, SeahorseEntity } from '../types';
import { Fish } from '../entities/Fish';
import { Crab } from '../entities/Crab';
import { Jellyfish } from '../entities/Jellyfish';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  FISH_SPAWN_Y_MIN,
  FISH_SPAWN_Y_MAX,
  SEAHORSE_CONFIG,
  CRAB_CONFIG,
  JELLYFISH_CONFIG
} from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { spriteLoader } from '../SpriteLoader';

export class SpawnSystem {
  private fishSpawnTimer: number = 0;
  private seahorseSpawnTimer: number = 0;
  private nextSeahorseSpawnTime: number = 0;
  private activeCrabs: Set<string> = new Set();
  private activeJellyfish: Set<string> = new Set();

  constructor() {
    // Initialize first seahorse spawn time (45-90 seconds)
    this.nextSeahorseSpawnTime = this.getRandomSeahorseSpawnTime();
  }

  /**
   * Update spawn system and return newly spawned entities
   */
  update(deltaTime: number, gameState: GameState): Entity[] {
    const spawnedEntities: Entity[] = [];

    // Update timers
    this.fishSpawnTimer += deltaTime;
    this.seahorseSpawnTimer += deltaTime;

    // Clean up inactive entities from tracking sets
    this.cleanupInactiveEntities(gameState.entities);

    // Spawn fish based on difficulty
    const fishSpawnInterval = 1.0 / gameState.difficulty.fishSpawnRate; // Convert rate to interval
    if (this.fishSpawnTimer >= fishSpawnInterval) {
      const fish = this.spawnFish(gameState);
      if (fish) {
        spawnedEntities.push(fish);
      }
      this.fishSpawnTimer = 0;
    }

    // Spawn seahorse based on timer
    if (this.seahorseSpawnTimer >= this.nextSeahorseSpawnTime) {
      const seahorse = this.spawnSeahorse();
      if (seahorse) {
        spawnedEntities.push(seahorse);
      }
      this.seahorseSpawnTimer = 0;
      this.nextSeahorseSpawnTime = this.getRandomSeahorseSpawnTime();
    }

    // Spawn crab if enabled and none exists
    if (gameState.difficulty.crabEnabled && this.activeCrabs.size === 0) {
      const crab = this.spawnCrab();
      if (crab) {
        spawnedEntities.push(crab);
        this.activeCrabs.add(crab.id);
      }
    }

    // Spawn jellyfish if enabled and under count limit
    if (gameState.difficulty.jellyfishEnabled && 
        this.activeJellyfish.size < gameState.difficulty.jellyfishCount) {
      const jellyfish = this.spawnJellyfish();
      if (jellyfish) {
        spawnedEntities.push(jellyfish);
        this.activeJellyfish.add(jellyfish.id);
      }
    }

    return spawnedEntities;
  }

  /**
   * Spawn a fish at a random edge position
   */
  private spawnFish(gameState: GameState): Fish | null {
    // Determine fish size based on difficulty and player tier
    const fishSize = this.determineFishSize(gameState);
    
    // Random Y position within valid spawn range
    const y = FISH_SPAWN_Y_MIN + Math.random() * (FISH_SPAWN_Y_MAX - FISH_SPAWN_Y_MIN);
    
    // Random side (left or right edge)
    const spawnFromLeft = Math.random() < 0.5;
    
    // Generate unique ID
    const id = uuidv4();
    
    // Create fish with speed multiplier from difficulty
    if (spawnFromLeft) {
      return Fish.spawnFromLeft(id, fishSize, y, gameState.difficulty.fishSpeedMultiplier);
    } else {
      return Fish.spawnFromRight(id, fishSize, y, gameState.difficulty.fishSpeedMultiplier);
    }
  }

  /**
   * Determine fish size based on difficulty and player tier
   */
  private determineFishSize(gameState: GameState): FishSize {
    const { largeFishRatio } = gameState.difficulty;
    const playerTier = gameState.player.tier;
    
    // Available fish sizes based on player tier
    const availableSizes: FishSize[] = [];
    
    // Always include smaller fish that player can eat
    if (playerTier >= 1) availableSizes.push('tiny');
    if (playerTier >= 2) availableSizes.push('small');
    if (playerTier >= 3) availableSizes.push('medium');
    if (playerTier >= 4) availableSizes.push('large');
    
    // Add larger fish that can eat the player (for challenge)
    const challengeFishes: FishSize[] = [];
    if (playerTier <= 4) challengeFishes.push('giant');
    if (playerTier <= 3) challengeFishes.push('large');
    if (playerTier <= 2) challengeFishes.push('medium');
    if (playerTier <= 1) challengeFishes.push('small');
    
    // Decide if we spawn a large/challenging fish based on largeFishRatio
    const spawnLargeFish = Math.random() < largeFishRatio && challengeFishes.length > 0;
    
    if (spawnLargeFish) {
      // Spawn a challenging fish
      return challengeFishes[Math.floor(Math.random() * challengeFishes.length)];
    } else {
      // Spawn an edible fish
      return availableSizes[Math.floor(Math.random() * availableSizes.length)];
    }
  }

  /**
   * Spawn a seahorse at a random position
   */
  private spawnSeahorse(): SeahorseEntity | null {
    // Random position within the canvas (avoiding edges)
    const margin = 50;
    const x = margin + Math.random() * (CANVAS_WIDTH - 2 * margin);
    const y = margin + Math.random() * (CANVAS_HEIGHT - 2 * margin);
    
    return new Seahorse(uuidv4(), { x, y });
  }

  /**
   * Get random seahorse spawn time (45-90 seconds)
   */
  private getRandomSeahorseSpawnTime(): number {
    return SEAHORSE_CONFIG.spawnIntervalMin + 
           Math.random() * (SEAHORSE_CONFIG.spawnIntervalMax - SEAHORSE_CONFIG.spawnIntervalMin);
  }

  /**
   * Spawn a crab at floor level
   */
  private spawnCrab(): Crab | null {
    // Random X position
    const x = Math.random() * CANVAS_WIDTH;
    
    return new Crab(uuidv4(), { x, y: CRAB_CONFIG.floorY });
  }

  /**
   * Spawn a jellyfish at floor level
   */
  private spawnJellyfish(): Jellyfish | null {
    // Random X position, start at floor
    const x = Math.random() * CANVAS_WIDTH;
    const y = CANVAS_HEIGHT - JELLYFISH_CONFIG.height / 2;
    
    return new Jellyfish(uuidv4(), { x, y });
  }

  /**
   * Clean up inactive entities from tracking sets
   */
  private cleanupInactiveEntities(entities: Entity[]): void {
    // Get active entity IDs
    const activeEntityIds = new Set(entities.filter(e => e.active).map(e => e.id));
    
    // Remove inactive crabs from tracking
    for (const crabId of this.activeCrabs) {
      if (!activeEntityIds.has(crabId)) {
        this.activeCrabs.delete(crabId);
      }
    }
    
    // Remove inactive jellyfish from tracking
    for (const jellyfishId of this.activeJellyfish) {
      if (!activeEntityIds.has(jellyfishId)) {
        this.activeJellyfish.delete(jellyfishId);
      }
    }
  }

  /**
   * Reset spawn timers (for game restart)
   */
  reset(): void {
    this.fishSpawnTimer = 0;
    this.seahorseSpawnTimer = 0;
    this.nextSeahorseSpawnTime = this.getRandomSeahorseSpawnTime();
    this.activeCrabs.clear();
    this.activeJellyfish.clear();
  }
}

/**
 * Seahorse Entity - Bonus entity that grants points and potential extra lives
 */
class Seahorse implements SeahorseEntity {
  public readonly id: string;
  public readonly type = 'seahorse' as const;
  public position: { x: number; y: number };
  public velocity: { x: number; y: number };
  public width: number = SEAHORSE_CONFIG.width;
  public height: number = SEAHORSE_CONFIG.height;
  public active: boolean = true;
  public lifetime: number = 0;

  private direction: { x: number; y: number };
  private directionChangeTimer: number = 0;
  private readonly directionChangeInterval: number = 0.5; // Change direction every 0.5 seconds

  constructor(id: string, position: { x: number; y: number }) {
    this.id = id;
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };
    
    // Initialize random direction
    this.direction = this.getRandomDirection();
    this.updateVelocity();
  }

  /**
   * Update seahorse movement and lifetime
   */
  update(deltaTime: number, _gameState: GameState): void {
    // Update lifetime
    this.lifetime += deltaTime;
    
    // Despawn after 8 seconds
    if (this.lifetime >= SEAHORSE_CONFIG.lifetime) {
      this.active = false;
      return;
    }

    // Update direction change timer
    this.directionChangeTimer += deltaTime;
    
    // Change direction periodically for erratic movement
    if (this.directionChangeTimer >= this.directionChangeInterval) {
      this.direction = this.getRandomDirection();
      this.updateVelocity();
      this.directionChangeTimer = 0;
    }

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Keep seahorse within canvas bounds
    const margin = this.width / 2;
    if (this.position.x < margin || this.position.x > CANVAS_WIDTH - margin) {
      this.direction.x *= -1;
      this.updateVelocity();
      this.position.x = Math.max(margin, Math.min(CANVAS_WIDTH - margin, this.position.x));
    }
    
    if (this.position.y < margin || this.position.y > CANVAS_HEIGHT - margin) {
      this.direction.y *= -1;
      this.updateVelocity();
      this.position.y = Math.max(margin, Math.min(CANVAS_HEIGHT - margin, this.position.y));
    }
  }

  /**
   * Get random direction for erratic movement
   */
  private getRandomDirection(): { x: number; y: number } {
    const angle = Math.random() * Math.PI * 2;
    return {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
  }

  /**
   * Update velocity based on current direction
   */
  private updateVelocity(): void {
    this.velocity.x = this.direction.x * SEAHORSE_CONFIG.speed;
    this.velocity.y = this.direction.y * SEAHORSE_CONFIG.speed;
  }

  /**
   * Render the seahorse
   */
  render(ctx: CanvasRenderingContext2D, _interpolation: number): void {
    const renderX = this.position.x;
    const renderY = this.position.y;

    ctx.save();

    // Draw lifetime indicator (fading effect) - applies to both sprite and fallback
    const remainingTime = SEAHORSE_CONFIG.lifetime - this.lifetime;
    if (remainingTime < 2) {
      // Flash when about to despawn
      const alpha = Math.sin(this.lifetime * 10) * 0.5 + 0.5;
      ctx.globalAlpha = alpha;
    }

    // Try to draw sprite, fallback to rectangle
    const sprite = spriteLoader.getSeahorseSprite();
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(
        sprite,
        renderX - this.width / 2,
        renderY - this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Fallback: Draw seahorse as a colored rectangle
      ctx.fillStyle = '#FFD700'; // Gold color
      ctx.fillRect(
        renderX - this.width / 2,
        renderY - this.height / 2,
        this.width,
        this.height
      );

      // Draw "S" indicator
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('S', renderX, renderY + 4);
    }

    // Draw warning border when about to despawn
    if (remainingTime < 2) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        renderX - this.width / 2 - 2,
        renderY - this.height / 2 - 2,
        this.width + 4,
        this.height + 4
      );
    }

    ctx.restore();
  }

  /**
   * Get bounding box for collision detection
   */
  getBoundingBox(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.position.x - this.width / 2,
      y: this.position.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}