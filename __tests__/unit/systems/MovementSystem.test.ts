/**
 * Unit tests for Movement System
 */

import { MovementSystem } from '../../../src/game/systems/MovementSystem';
import { PlayerState, InputVector } from '../../../src/game/types';
import { PLAYER_BASE_SPEED, PLAYER_TIER_SPEED_BONUS, PLAYER_FRICTION } from '../../../src/game/constants';

describe('MovementSystem', () => {
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

  describe('applyAcceleration', () => {
    it('should apply acceleration based on input', () => {
      const input: InputVector = { x: 1, y: 0 };
      const deltaTime = 1/60; // 60 FPS
      
      MovementSystem.applyAcceleration(player, input, deltaTime);
      
      expect(player.velocity.x).toBeGreaterThan(0);
      expect(player.velocity.y).toBe(0);
    });

    it('should handle diagonal input', () => {
      const input: InputVector = { x: 1, y: 1 };
      const deltaTime = 1/60;
      
      MovementSystem.applyAcceleration(player, input, deltaTime);
      
      expect(player.velocity.x).toBeGreaterThan(0);
      expect(player.velocity.y).toBeGreaterThan(0);
    });
  });

  describe('applyFriction', () => {
    it('should reduce velocity by friction coefficient', () => {
      player.velocity = { x: 100, y: 50 };
      
      MovementSystem.applyFriction(player);
      
      expect(player.velocity.x).toBeCloseTo(100 * PLAYER_FRICTION);
      expect(player.velocity.y).toBeCloseTo(50 * PLAYER_FRICTION);
    });
  });

  describe('clampVelocity', () => {
    it('should clamp velocity to max speed for tier 1', () => {
      const maxSpeed = PLAYER_BASE_SPEED + (1 * PLAYER_TIER_SPEED_BONUS);
      player.velocity = { x: maxSpeed + 100, y: 0 };
      
      MovementSystem.clampVelocity(player);
      
      expect(Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2)).toBeCloseTo(maxSpeed);
    });

    it('should not clamp velocity if within limits', () => {
      player.velocity = { x: 50, y: 30 };
      const originalMagnitude = Math.sqrt(50 ** 2 + 30 ** 2);
      
      MovementSystem.clampVelocity(player);
      
      const newMagnitude = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
      expect(newMagnitude).toBeCloseTo(originalMagnitude);
    });
  });

  describe('updatePosition', () => {
    it('should update position based on velocity', () => {
      player.velocity = { x: 60, y: 30 }; // 60 px/s right, 30 px/s down
      const deltaTime = 1; // 1 second
      
      MovementSystem.updatePosition(player, deltaTime);
      
      expect(player.position.x).toBe(460); // 400 + 60
      expect(player.position.y).toBe(330); // 300 + 30
    });

    it('should update facing direction based on velocity', () => {
      player.velocity = { x: 10, y: 0 };
      MovementSystem.updatePosition(player, 1/60);
      expect(player.facingLeft).toBe(false);

      player.velocity = { x: -10, y: 0 };
      MovementSystem.updatePosition(player, 1/60);
      expect(player.facingLeft).toBe(true);
    });
  });

  describe('getMaxSpeed', () => {
    it('should calculate correct max speed for different tiers', () => {
      expect(MovementSystem.getMaxSpeed(1)).toBe(PLAYER_BASE_SPEED + PLAYER_TIER_SPEED_BONUS);
      expect(MovementSystem.getMaxSpeed(3)).toBe(PLAYER_BASE_SPEED + (3 * PLAYER_TIER_SPEED_BONUS));
      expect(MovementSystem.getMaxSpeed(5)).toBe(PLAYER_BASE_SPEED + (5 * PLAYER_TIER_SPEED_BONUS));
    });
  });
});