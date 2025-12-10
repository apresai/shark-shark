/**
 * Movement System for Shark Shark
 * Handles player movement physics including acceleration, friction, and velocity clamping
 */

import { Vector2D, InputVector, PlayerState } from '@/game/types';
import { 
  PLAYER_BASE_SPEED, 
  PLAYER_TIER_SPEED_BONUS, 
  PLAYER_FRICTION, 
  PLAYER_ACCELERATION 
} from '@/game/constants';
import { 
  vectorAdd, 
  vectorMultiply, 
  clampMagnitude, 
  vectorMagnitude 
} from '@/lib/math';

/**
 * Movement System class for handling player physics
 */
export class MovementSystem {
  /**
   * Apply acceleration based on input vector
   * @param player Current player state
   * @param input Input vector from controls (-1 to 1 for each axis)
   * @param deltaTime Time elapsed since last update (in seconds)
   */
  static applyAcceleration(player: PlayerState, input: InputVector, deltaTime: number): void {
    // Calculate acceleration vector based on input
    const accelerationVector: Vector2D = {
      x: input.x * PLAYER_ACCELERATION * deltaTime,
      y: input.y * PLAYER_ACCELERATION * deltaTime,
    };
    
    // Add acceleration to current velocity
    player.velocity = vectorAdd(player.velocity, accelerationVector);
  }

  /**
   * Apply friction to reduce velocity over time
   * @param player Current player state
   */
  static applyFriction(player: PlayerState): void {
    // Apply friction coefficient (0.92 per frame)
    player.velocity = vectorMultiply(player.velocity, PLAYER_FRICTION);
  }

  /**
   * Clamp velocity to maximum speed based on player tier
   * @param player Current player state
   */
  static clampVelocity(player: PlayerState): void {
    // Calculate max speed: base speed + tier bonus
    const maxSpeed = PLAYER_BASE_SPEED + (player.tier * PLAYER_TIER_SPEED_BONUS);
    
    // Clamp velocity magnitude to max speed
    player.velocity = clampMagnitude(player.velocity, maxSpeed);
  }

  /**
   * Update player position based on velocity and deltaTime
   * @param player Current player state
   * @param deltaTime Time elapsed since last update (in seconds)
   */
  static updatePosition(player: PlayerState, deltaTime: number): void {
    // Update position: position += velocity * deltaTime
    const deltaPosition = vectorMultiply(player.velocity, deltaTime);
    player.position = vectorAdd(player.position, deltaPosition);
    
    // Update facing direction based on horizontal velocity
    if (player.velocity.x > 0.1) {
      player.facingLeft = false;
    } else if (player.velocity.x < -0.1) {
      player.facingLeft = true;
    }
    // If velocity.x is near zero, keep current facing direction
  }

  /**
   * Complete movement physics update for player
   * Combines acceleration, friction, velocity clamping, and position update
   * @param player Current player state
   * @param input Input vector from controls
   * @param deltaTime Time elapsed since last update (in seconds)
   */
  static updatePlayerMovement(player: PlayerState, input: InputVector, deltaTime: number): void {
    // 1. Apply acceleration based on input
    this.applyAcceleration(player, input, deltaTime);
    
    // 2. Apply friction
    this.applyFriction(player);
    
    // 3. Clamp velocity to max speed
    this.clampVelocity(player);
    
    // 4. Update position
    this.updatePosition(player, deltaTime);
  }

  /**
   * Get current speed (magnitude of velocity) for debugging/display
   * @param player Current player state
   * @returns Current speed in pixels per second
   */
  static getCurrentSpeed(player: PlayerState): number {
    return vectorMagnitude(player.velocity);
  }

  /**
   * Get maximum speed for current tier
   * @param tier Player tier (1-5)
   * @returns Maximum speed in pixels per second
   */
  static getMaxSpeed(tier: number): number {
    return PLAYER_BASE_SPEED + (tier * PLAYER_TIER_SPEED_BONUS);
  }
}