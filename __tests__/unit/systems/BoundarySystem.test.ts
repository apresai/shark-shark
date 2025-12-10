/**
 * Unit tests for Boundary System
 */

import { BoundarySystem } from '../../../src/game/systems/BoundarySystem';
import { PlayerState } from '../../../src/game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../src/game/constants';

describe('BoundarySystem', () => {
  let player: PlayerState;

  beforeEach(() => {
    player = {
      position: { x: 400, y: 300 },
      velocity: { x: 0, y: 0 },
      tier: 1,
      width: 16,
      height: 12,
      fishEaten: 0,
      facingLeft: false,
      invulnerable: false,
      invulnerableTimer: 0,
    };
  });

  describe('handleHorizontalWrapAround', () => {
    it('should wrap player from left edge to right edge', () => {
      player.position.x = -player.width / 2 - 1; // Just off left edge
      
      BoundarySystem.handleHorizontalWrapAround(player);
      
      expect(player.position.x).toBe(CANVAS_WIDTH - player.width / 2);
    });

    it('should wrap player from right edge to left edge', () => {
      player.position.x = CANVAS_WIDTH + player.width / 2 + 1; // Just off right edge
      
      BoundarySystem.handleHorizontalWrapAround(player);
      
      expect(player.position.x).toBe(-player.width / 2);
    });

    it('should not wrap player when within bounds', () => {
      const originalX = player.position.x;
      
      BoundarySystem.handleHorizontalWrapAround(player);
      
      expect(player.position.x).toBe(originalX);
    });
  });

  describe('handleVerticalClamping', () => {
    it('should clamp player at top boundary', () => {
      player.position.y = -10; // Above top edge
      player.velocity.y = -50; // Moving upward
      
      BoundarySystem.handleVerticalClamping(player);
      
      expect(player.position.y).toBe(player.height / 2);
      expect(player.velocity.y).toBe(0); // Velocity should be stopped
    });

    it('should clamp player at bottom boundary', () => {
      player.position.y = CANVAS_HEIGHT + 10; // Below bottom edge
      player.velocity.y = 50; // Moving downward
      
      BoundarySystem.handleVerticalClamping(player);
      
      expect(player.position.y).toBe(CANVAS_HEIGHT - player.height / 2);
      expect(player.velocity.y).toBe(0); // Velocity should be stopped
    });

    it('should not clamp player when within bounds', () => {
      const originalY = player.position.y;
      const originalVelocityY = player.velocity.y;
      
      BoundarySystem.handleVerticalClamping(player);
      
      expect(player.position.y).toBe(originalY);
      expect(player.velocity.y).toBe(originalVelocityY);
    });
  });

  describe('utility functions', () => {
    it('should check if entity is within horizontal bounds', () => {
      expect(BoundarySystem.isWithinHorizontalBounds(400, 20)).toBe(true);
      expect(BoundarySystem.isWithinHorizontalBounds(-20, 20)).toBe(false);
      expect(BoundarySystem.isWithinHorizontalBounds(CANVAS_WIDTH + 20, 20)).toBe(false);
    });

    it('should check if entity is within vertical bounds', () => {
      expect(BoundarySystem.isWithinVerticalBounds(300, 20)).toBe(true);
      expect(BoundarySystem.isWithinVerticalBounds(-20, 20)).toBe(false);
      expect(BoundarySystem.isWithinVerticalBounds(CANVAS_HEIGHT + 20, 20)).toBe(false);
    });

    it('should check if entity is completely off screen', () => {
      expect(BoundarySystem.isCompletelyOffScreen(400, 300, 20, 20)).toBe(false);
      expect(BoundarySystem.isCompletelyOffScreen(-30, 300, 20, 20)).toBe(true);
      expect(BoundarySystem.isCompletelyOffScreen(CANVAS_WIDTH + 30, 300, 20, 20)).toBe(true);
    });

    it('should wrap X coordinate correctly', () => {
      expect(BoundarySystem.wrapX(-20, 20)).toBe(CANVAS_WIDTH + 10);
      expect(BoundarySystem.wrapX(CANVAS_WIDTH + 20, 20)).toBe(-10);
      expect(BoundarySystem.wrapX(400, 20)).toBe(400);
    });

    it('should clamp Y coordinate correctly', () => {
      expect(BoundarySystem.clampY(-10, 20)).toBe(10);
      expect(BoundarySystem.clampY(CANVAS_HEIGHT + 10, 20)).toBe(CANVAS_HEIGHT - 10);
      expect(BoundarySystem.clampY(300, 20)).toBe(300);
    });
  });
});