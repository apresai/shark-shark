/**
 * Boundary System for Shark Shark
 * Handles player boundary constraints: horizontal wrap-around and vertical clamping
 */

import { PlayerState } from '@/game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/game/constants';

/**
 * Boundary System class for handling screen edge behavior
 */
export class BoundarySystem {
  /**
   * Handle horizontal wrap-around at left/right screen edges
   * When player goes off left edge, wrap to right side and vice versa
   * @param player Current player state
   */
  static handleHorizontalWrapAround(player: PlayerState): void {
    // Check left edge - if player center is off-screen left
    if (player.position.x + player.width / 2 < 0) {
      // Wrap to right side - position player just off right edge
      player.position.x = CANVAS_WIDTH - player.width / 2;
    }
    // Check right edge - if player center is off-screen right  
    else if (player.position.x - player.width / 2 > CANVAS_WIDTH) {
      // Wrap to left side - position player just off left edge
      player.position.x = -player.width / 2;
    }
  }

  /**
   * Handle vertical boundary clamping at top/bottom screen edges
   * Player cannot move beyond top (surface) or bottom (floor) of screen
   * @param player Current player state
   */
  static handleVerticalClamping(player: PlayerState): void {
    const halfHeight = player.height / 2;
    
    // Clamp to top boundary (surface)
    if (player.position.y - halfHeight < 0) {
      player.position.y = halfHeight;
      // Stop upward velocity when hitting top
      if (player.velocity.y < 0) {
        player.velocity.y = 0;
      }
    }
    
    // Clamp to bottom boundary (floor)
    if (player.position.y + halfHeight > CANVAS_HEIGHT) {
      player.position.y = CANVAS_HEIGHT - halfHeight;
      // Stop downward velocity when hitting bottom
      if (player.velocity.y > 0) {
        player.velocity.y = 0;
      }
    }
  }

  /**
   * Apply all boundary constraints to player
   * Combines horizontal wrap-around and vertical clamping
   * @param player Current player state
   */
  static applyBoundaryConstraints(player: PlayerState): void {
    this.handleHorizontalWrapAround(player);
    this.handleVerticalClamping(player);
  }

  /**
   * Check if position is within horizontal bounds (for other entities)
   * @param x X position to check
   * @param width Entity width
   * @returns True if entity is within horizontal screen bounds
   */
  static isWithinHorizontalBounds(x: number, width: number): boolean {
    return x + width / 2 >= 0 && x - width / 2 <= CANVAS_WIDTH;
  }

  /**
   * Check if position is within vertical bounds (for other entities)
   * @param y Y position to check
   * @param height Entity height
   * @returns True if entity is within vertical screen bounds
   */
  static isWithinVerticalBounds(y: number, height: number): boolean {
    return y + height / 2 >= 0 && y - height / 2 <= CANVAS_HEIGHT;
  }

  /**
   * Check if entity is completely outside screen bounds (for despawning)
   * @param x X position
   * @param y Y position
   * @param width Entity width
   * @param height Entity height
   * @returns True if entity is completely off-screen
   */
  static isCompletelyOffScreen(x: number, y: number, width: number, height: number): boolean {
    return (
      x + width / 2 < 0 ||           // Off left edge
      x - width / 2 > CANVAS_WIDTH || // Off right edge
      y + height / 2 < 0 ||          // Off top edge
      y - height / 2 > CANVAS_HEIGHT  // Off bottom edge
    );
  }

  /**
   * Wrap X coordinate for horizontal wrap-around (utility function)
   * @param x X position to wrap
   * @param width Entity width
   * @returns Wrapped X position
   */
  static wrapX(x: number, width: number): number {
    const halfWidth = width / 2;
    
    if (x + halfWidth < 0) {
      return CANVAS_WIDTH + halfWidth;
    } else if (x - halfWidth > CANVAS_WIDTH) {
      return -halfWidth;
    }
    
    return x;
  }

  /**
   * Clamp Y coordinate to vertical bounds (utility function)
   * @param y Y position to clamp
   * @param height Entity height
   * @returns Clamped Y position
   */
  static clampY(y: number, height: number): number {
    const halfHeight = height / 2;
    
    if (y - halfHeight < 0) {
      return halfHeight;
    } else if (y + halfHeight > CANVAS_HEIGHT) {
      return CANVAS_HEIGHT - halfHeight;
    }
    
    return y;
  }
}