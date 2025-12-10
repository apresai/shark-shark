/**
 * Unit tests for Growth System
 */

import { GrowthSystem } from '../../../src/game/systems/GrowthSystem';
import { PlayerState } from '../../../src/game/types';
import { TIER_THRESHOLDS, TIER_DIMENSIONS, MAX_TIER } from '../../../src/game/constants';

describe('GrowthSystem', () => {
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

  describe('calculateTier', () => {
    it('should return tier 1 for 0 fish eaten', () => {
      expect(GrowthSystem.calculateTier(0)).toBe(1);
    });

    it('should return tier 1 for fish count below tier 2 threshold', () => {
      expect(GrowthSystem.calculateTier(4)).toBe(1);
    });

    it('should return tier 2 for fish count at tier 2 threshold', () => {
      expect(GrowthSystem.calculateTier(5)).toBe(2);
    });

    it('should return tier 3 for fish count at tier 3 threshold', () => {
      expect(GrowthSystem.calculateTier(15)).toBe(3);
    });

    it('should return tier 4 for fish count at tier 4 threshold', () => {
      expect(GrowthSystem.calculateTier(30)).toBe(4);
    });

    it('should return tier 5 for fish count at tier 5 threshold', () => {
      expect(GrowthSystem.calculateTier(50)).toBe(5);
    });

    it('should cap at tier 5 for very high fish counts', () => {
      expect(GrowthSystem.calculateTier(1000)).toBe(5);
    });

    it('should return correct tier for fish count between thresholds', () => {
      expect(GrowthSystem.calculateTier(10)).toBe(2); // Between tier 2 (5) and tier 3 (15)
      expect(GrowthSystem.calculateTier(25)).toBe(3); // Between tier 3 (15) and tier 4 (30)
      expect(GrowthSystem.calculateTier(40)).toBe(4); // Between tier 4 (30) and tier 5 (50)
    });
  });

  describe('checkTierUp', () => {
    it('should return no tier up when fish count is below next threshold', () => {
      player.fishEaten = 3;
      player.tier = 1;
      
      const result = GrowthSystem.checkTierUp(player);
      
      expect(result.tierUp).toBe(false);
      expect(result.newTier).toBe(1);
    });

    it('should return tier up when fish count reaches next threshold', () => {
      player.fishEaten = 5;
      player.tier = 1;
      
      const result = GrowthSystem.checkTierUp(player);
      
      expect(result.tierUp).toBe(true);
      expect(result.newTier).toBe(2);
    });

    it('should handle multiple tier jumps', () => {
      player.fishEaten = 20;
      player.tier = 1;
      
      const result = GrowthSystem.checkTierUp(player);
      
      expect(result.tierUp).toBe(true);
      expect(result.newTier).toBe(3);
    });

    it('should return no tier up when already at max tier', () => {
      player.fishEaten = 100;
      player.tier = 5;
      
      const result = GrowthSystem.checkTierUp(player);
      
      expect(result.tierUp).toBe(false);
      expect(result.newTier).toBe(5);
    });
  });

  describe('applyTierUp', () => {
    it('should update player tier and dimensions', () => {
      GrowthSystem.applyTierUp(player, 3);
      
      expect(player.tier).toBe(3);
      expect(player.width).toBe(TIER_DIMENSIONS[3].width);
      expect(player.height).toBe(TIER_DIMENSIONS[3].height);
    });

    it('should handle tier 5 correctly', () => {
      GrowthSystem.applyTierUp(player, 5);
      
      expect(player.tier).toBe(5);
      expect(player.width).toBe(TIER_DIMENSIONS[5].width);
      expect(player.height).toBe(TIER_DIMENSIONS[5].height);
    });
  });

  describe('getFishNeededForNextTier', () => {
    it('should return correct fish count for next tier', () => {
      expect(GrowthSystem.getFishNeededForNextTier(1)).toBe(TIER_THRESHOLDS[2]);
      expect(GrowthSystem.getFishNeededForNextTier(2)).toBe(TIER_THRESHOLDS[3]);
      expect(GrowthSystem.getFishNeededForNextTier(3)).toBe(TIER_THRESHOLDS[4]);
      expect(GrowthSystem.getFishNeededForNextTier(4)).toBe(TIER_THRESHOLDS[5]);
    });

    it('should return 0 for max tier', () => {
      expect(GrowthSystem.getFishNeededForNextTier(5)).toBe(0);
    });
  });

  describe('getTierProgress', () => {
    it('should return 0 progress at tier start', () => {
      expect(GrowthSystem.getTierProgress(5, 2)).toBeCloseTo(0); // Just reached tier 2
    });

    it('should return partial progress within tier', () => {
      expect(GrowthSystem.getTierProgress(10, 2)).toBeCloseTo(0.5); // Halfway from tier 2 (5) to tier 3 (15)
    });

    it('should return 1 for max tier', () => {
      expect(GrowthSystem.getTierProgress(100, 5)).toBe(1);
    });

    it('should cap progress at 1', () => {
      expect(GrowthSystem.getTierProgress(14, 2)).toBeCloseTo(0.9); // Almost at tier 3
    });
  });

  describe('updatePlayerGrowth', () => {
    it('should return false when no tier up occurs', () => {
      player.fishEaten = 3;
      player.tier = 1;
      
      const tierUp = GrowthSystem.updatePlayerGrowth(player);
      
      expect(tierUp).toBe(false);
      expect(player.tier).toBe(1);
    });

    it('should return true and update player when tier up occurs', () => {
      player.fishEaten = 15;
      player.tier = 1;
      
      const tierUp = GrowthSystem.updatePlayerGrowth(player);
      
      expect(tierUp).toBe(true);
      expect(player.tier).toBe(3);
      expect(player.width).toBe(TIER_DIMENSIONS[3].width);
      expect(player.height).toBe(TIER_DIMENSIONS[3].height);
    });

    it('should handle reaching max tier', () => {
      player.fishEaten = 50;
      player.tier = 4;
      
      const tierUp = GrowthSystem.updatePlayerGrowth(player);
      
      expect(tierUp).toBe(true);
      expect(player.tier).toBe(5);
    });
  });
});