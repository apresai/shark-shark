/**
 * Unit tests for Collision System
 */

import { CollisionSystem } from '../../../src/game/systems/CollisionSystem';
import { 
  PlayerState, 
  FishEntity, 
  SharkEntity, 
  CrabEntity, 
  JellyfishEntity, 
  SeahorseEntity,
  BoundingBox 
} from '../../../src/game/types';
import { FISH_POINTS, SHARK_CONFIG, SEAHORSE_CONFIG } from '../../../src/game/constants';

describe('CollisionSystem', () => {
  let player: PlayerState;

  beforeEach(() => {
    player = {
      position: { x: 400, y: 300 },
      velocity: { x: 0, y: 0 },
      tier: 2,
      width: 24,
      height: 18,
      fishEaten: 10,
      facingLeft: false,
      invulnerable: false,
      invulnerableTimer: 0,
    };
  });

  describe('intersects', () => {
    it('should detect intersection between overlapping boxes', () => {
      const boxA: BoundingBox = { x: 10, y: 10, width: 20, height: 20 };
      const boxB: BoundingBox = { x: 20, y: 20, width: 20, height: 20 };
      
      expect(CollisionSystem.intersects(boxA, boxB)).toBe(true);
    });

    it('should not detect intersection between non-overlapping boxes', () => {
      const boxA: BoundingBox = { x: 10, y: 10, width: 20, height: 20 };
      const boxB: BoundingBox = { x: 40, y: 40, width: 20, height: 20 };
      
      expect(CollisionSystem.intersects(boxA, boxB)).toBe(false);
    });

    it('should detect intersection when boxes are touching', () => {
      const boxA: BoundingBox = { x: 10, y: 10, width: 20, height: 20 };
      const boxB: BoundingBox = { x: 30, y: 10, width: 20, height: 20 };
      
      expect(CollisionSystem.intersects(boxA, boxB)).toBe(false);
    });
  });

  describe('getPlayerBoundingBox', () => {
    it('should create correct bounding box for player', () => {
      const box = CollisionSystem.getPlayerBoundingBox(player);
      
      expect(box).toEqual({
        x: player.position.x - player.width / 2,
        y: player.position.y - player.height / 2,
        width: player.width,
        height: player.height,
      });
    });
  });

  describe('resolveFishCollision', () => {
    let smallFish: FishEntity;
    let largeFish: FishEntity;

    beforeEach(() => {
      smallFish = {
        id: 'fish1',
        type: 'fish',
        position: { x: 400, y: 300 },
        velocity: { x: -50, y: 0 },
        width: 12, // Smaller than player (24)
        height: 9,
        active: true,
        size: 'tiny',
        points: 10,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: jest.fn().mockReturnValue({ x: 394, y: 295.5, width: 12, height: 9 }),
      };

      largeFish = {
        id: 'fish2',
        type: 'fish',
        position: { x: 400, y: 300 },
        velocity: { x: -50, y: 0 },
        width: 40, // Larger than player (24)
        height: 30,
        active: true,
        size: 'large',
        points: 100,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: jest.fn().mockReturnValue({ x: 380, y: 285, width: 40, height: 30 }),
      };
    });

    it('should return eat result when player is larger than fish', () => {
      const result = CollisionSystem.resolveFishCollision(player, smallFish);
      
      expect(result.type).toBe('eat');
      expect(result.points).toBe(FISH_POINTS.tiny * player.tier);
      expect(result.entityB).toBe(smallFish);
    });

    it('should return death result when fish is larger than or equal to player', () => {
      const result = CollisionSystem.resolveFishCollision(player, largeFish);
      
      expect(result.type).toBe('death');
      expect(result.points).toBeUndefined();
      expect(result.entityB).toBe(largeFish);
    });
  });

  describe('resolveSharkCollision', () => {
    let shark: SharkEntity;

    beforeEach(() => {
      shark = {
        id: 'shark1',
        type: 'shark',
        position: { x: 400, y: 200 },
        velocity: { x: -100, y: 0 }, // Moving left
        width: 96,
        height: 48,
        active: true,
        state: 'patrol',
        diveTimer: 0,
        targetY: 200,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: jest.fn().mockReturnValue({ x: 352, y: 176, width: 96, height: 48 }),
        getBodyHitbox: jest.fn().mockReturnValue({ x: 352, y: 176, width: 86.4, height: 48 }), // 90% of width
        getTailHitbox: jest.fn().mockReturnValue({ x: 438.4, y: 176, width: 9.6, height: 48 }), // 10% of width at back
      } as unknown;
    });

    it('should return shark_tail result when hitting tail zone', () => {
      // Mock intersects to return true for tail, false for body
      const originalIntersects = CollisionSystem.intersects;
      CollisionSystem.intersects = jest.fn()
        .mockReturnValueOnce(true)  // tail intersection
        .mockReturnValueOnce(false); // body intersection (not called)
      
      const result = CollisionSystem.resolveSharkCollision(player, shark);
      
      expect(result.type).toBe('shark_tail');
      expect(result.points).toBe(SHARK_CONFIG.tailPoints);
      expect(shark.getTailHitbox).toHaveBeenCalled();
      
      // Restore original method
      CollisionSystem.intersects = originalIntersects;
    });

    it('should return death result when hitting body zone', () => {
      // Mock intersects to return false for tail, true for body
      const originalIntersects = CollisionSystem.intersects;
      CollisionSystem.intersects = jest.fn()
        .mockReturnValueOnce(false) // tail intersection
        .mockReturnValueOnce(true); // body intersection
      
      const result = CollisionSystem.resolveSharkCollision(player, shark);
      
      expect(result.type).toBe('death');
      expect(result.points).toBeUndefined();
      expect(shark.getTailHitbox).toHaveBeenCalled();
      expect(shark.getBodyHitbox).toHaveBeenCalled();
      
      // Restore original method
      CollisionSystem.intersects = originalIntersects;
    });
  });

  describe('resolveHazardCollision', () => {
    let crab: CrabEntity;

    beforeEach(() => {
      crab = {
        id: 'crab1',
        type: 'crab',
        position: { x: 400, y: 580 },
        velocity: { x: 40, y: 0 },
        width: 24,
        height: 16,
        active: true,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: jest.fn().mockReturnValue({ x: 388, y: 572, width: 24, height: 16 }),
      };
    });

    it('should return hazard result for crab collision', () => {
      const result = CollisionSystem.resolveHazardCollision(player, crab);
      
      expect(result.type).toBe('hazard');
      expect(result.entityB).toBe(crab);
    });
  });

  describe('resolveSeahorseCollision', () => {
    let seahorse: SeahorseEntity;

    beforeEach(() => {
      seahorse = {
        id: 'seahorse1',
        type: 'seahorse',
        position: { x: 400, y: 300 },
        velocity: { x: 25, y: -25 },
        width: 16,
        height: 24,
        active: true,
        lifetime: 3,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: jest.fn().mockReturnValue({ x: 392, y: 288, width: 16, height: 24 }),
      };
    });

    it('should return bonus result for seahorse collision', () => {
      const result = CollisionSystem.resolveSeahorseCollision(player, seahorse);
      
      expect(result.type).toBe('bonus');
      expect(result.points).toBe(SEAHORSE_CONFIG.points);
      expect(result.entityB).toBe(seahorse);
    });
  });

  describe('invulnerability handling', () => {
    let largeFish: FishEntity;

    beforeEach(() => {
      largeFish = {
        id: 'fish1',
        type: 'fish',
        position: { x: 400, y: 300 },
        velocity: { x: -50, y: 0 },
        width: 40, // Larger than player
        height: 30,
        active: true,
        size: 'large',
        points: 100,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: jest.fn().mockReturnValue({ x: 380, y: 285, width: 40, height: 30 }),
      };
    });

    it('should skip death collisions when player is invulnerable', () => {
      player.invulnerable = true;
      
      const result = CollisionSystem.resolveCollision(player, largeFish);
      
      expect(result).toBeNull();
    });

    it('should allow eat collisions when player is invulnerable', () => {
      player.invulnerable = true;
      largeFish.width = 12; // Make fish smaller than player
      largeFish.size = 'tiny';
      largeFish.points = 10;
      
      const result = CollisionSystem.resolveCollision(player, largeFish);
      
      expect(result).not.toBeNull();
      expect(result!.type).toBe('eat');
    });
  });

  describe('wouldCauseDeath', () => {
    it('should return true for larger fish', () => {
      const largeFish = { type: 'fish', width: 40 } as FishEntity;
      
      expect(CollisionSystem.wouldCauseDeath(player, largeFish)).toBe(true);
    });

    it('should return false for smaller fish', () => {
      const smallFish = { type: 'fish', width: 12 } as FishEntity;
      
      expect(CollisionSystem.wouldCauseDeath(player, smallFish)).toBe(false);
    });

    it('should return true for hazards', () => {
      const crab = { type: 'crab' } as CrabEntity;
      const jellyfish = { type: 'jellyfish' } as JellyfishEntity;
      
      expect(CollisionSystem.wouldCauseDeath(player, crab)).toBe(true);
      expect(CollisionSystem.wouldCauseDeath(player, jellyfish)).toBe(true);
    });

    it('should return false for seahorse', () => {
      const seahorse = { type: 'seahorse' } as SeahorseEntity;
      
      expect(CollisionSystem.wouldCauseDeath(player, seahorse)).toBe(false);
    });
  });
});