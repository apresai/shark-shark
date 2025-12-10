/**
 * Unit Tests for DifficultySystem
 */

import { DifficultySystem } from '../../../src/game/systems/DifficultySystem';
import { DIFFICULTY_CONFIG } from '../../../src/game/constants';

describe('DifficultySystem', () => {
  describe('calculateDifficulty', () => {
    it('should return minimum difficulty at game start', () => {
      const difficulty = DifficultySystem.calculateDifficulty(0, 1);
      
      expect(difficulty.fishSpawnRate).toBe(DIFFICULTY_CONFIG.fishSpawnRateMin);
      expect(difficulty.fishSpeedMultiplier).toBe(DIFFICULTY_CONFIG.fishSpeedMultiplierMin);
      expect(difficulty.largeFishRatio).toBe(DIFFICULTY_CONFIG.largeFishRatioMin);
      expect(difficulty.sharkEnabled).toBe(false);
      expect(difficulty.crabEnabled).toBe(false);
      expect(difficulty.jellyfishEnabled).toBe(false);
      expect(difficulty.jellyfishCount).toBe(0);
    });

    it('should return maximum difficulty at max time', () => {
      const difficulty = DifficultySystem.calculateDifficulty(DIFFICULTY_CONFIG.maxDifficultyTime, 5);
      
      expect(difficulty.fishSpawnRate).toBe(DIFFICULTY_CONFIG.fishSpawnRateMax);
      expect(difficulty.fishSpeedMultiplier).toBe(DIFFICULTY_CONFIG.fishSpeedMultiplierMax);
      expect(difficulty.largeFishRatio).toBe(DIFFICULTY_CONFIG.largeFishRatioMax);
      expect(difficulty.sharkEnabled).toBe(true);
      expect(difficulty.crabEnabled).toBe(true);
      expect(difficulty.jellyfishEnabled).toBe(true);
      expect(difficulty.jellyfishCount).toBe(3);
    });

    it('should enable shark after 20 seconds', () => {
      const difficultyBefore = DifficultySystem.calculateDifficulty(19, 1);
      const difficultyAfter = DifficultySystem.calculateDifficulty(21, 1);
      
      expect(difficultyBefore.sharkEnabled).toBe(false);
      expect(difficultyAfter.sharkEnabled).toBe(true);
    });

    it('should enable crab at tier 2', () => {
      const difficultyTier1 = DifficultySystem.calculateDifficulty(30, 1);
      const difficultyTier2 = DifficultySystem.calculateDifficulty(30, 2);
      
      expect(difficultyTier1.crabEnabled).toBe(false);
      expect(difficultyTier2.crabEnabled).toBe(true);
    });

    it('should enable jellyfish after 60 seconds', () => {
      const difficultyBefore = DifficultySystem.calculateDifficulty(59, 3);
      const difficultyAfter = DifficultySystem.calculateDifficulty(61, 3);
      
      expect(difficultyBefore.jellyfishEnabled).toBe(false);
      expect(difficultyAfter.jellyfishEnabled).toBe(true);
      expect(difficultyAfter.jellyfishCount).toBe(1);
    });

    it('should gradually increase jellyfish count over time', () => {
      const difficulty60s = DifficultySystem.calculateDifficulty(60, 3);
      const difficulty120s = DifficultySystem.calculateDifficulty(120, 3);
      const difficulty180s = DifficultySystem.calculateDifficulty(180, 3);
      
      expect(difficulty60s.jellyfishCount).toBe(1);
      expect(difficulty120s.jellyfishCount).toBe(2);
      expect(difficulty180s.jellyfishCount).toBe(3);
    });

    it('should interpolate values correctly at mid-point', () => {
      const midTime = DIFFICULTY_CONFIG.maxDifficultyTime / 2;
      const difficulty = DifficultySystem.calculateDifficulty(midTime, 3);
      
      const expectedSpawnRate = (DIFFICULTY_CONFIG.fishSpawnRateMin + DIFFICULTY_CONFIG.fishSpawnRateMax) / 2;
      const expectedSpeedMultiplier = (DIFFICULTY_CONFIG.fishSpeedMultiplierMin + DIFFICULTY_CONFIG.fishSpeedMultiplierMax) / 2;
      const expectedLargeFishRatio = (DIFFICULTY_CONFIG.largeFishRatioMin + DIFFICULTY_CONFIG.largeFishRatioMax) / 2;
      
      expect(difficulty.fishSpawnRate).toBeCloseTo(expectedSpawnRate, 2);
      expect(difficulty.fishSpeedMultiplier).toBeCloseTo(expectedSpeedMultiplier, 2);
      expect(difficulty.largeFishRatio).toBeCloseTo(expectedLargeFishRatio, 2);
    });

    it('should cap difficulty progression at max time', () => {
      const difficulty = DifficultySystem.calculateDifficulty(DIFFICULTY_CONFIG.maxDifficultyTime * 2, 5);
      
      expect(difficulty.fishSpawnRate).toBe(DIFFICULTY_CONFIG.fishSpawnRateMax);
      expect(difficulty.fishSpeedMultiplier).toBe(DIFFICULTY_CONFIG.fishSpeedMultiplierMax);
      expect(difficulty.largeFishRatio).toBe(DIFFICULTY_CONFIG.largeFishRatioMax);
    });
  });

  describe('getHazardEnableStatus', () => {
    it('should return correct hazard status at game start', () => {
      const status = DifficultySystem.getHazardEnableStatus(0, 1);
      
      expect(status.sharkEnabled).toBe(false);
      expect(status.crabEnabled).toBe(false);
      expect(status.jellyfishEnabled).toBe(false);
    });

    it('should enable shark after 20 seconds', () => {
      const status = DifficultySystem.getHazardEnableStatus(21, 1);
      
      expect(status.sharkEnabled).toBe(true);
    });

    it('should enable crab at tier 2', () => {
      const status = DifficultySystem.getHazardEnableStatus(10, 2);
      
      expect(status.crabEnabled).toBe(true);
    });

    it('should enable jellyfish after 60 seconds', () => {
      const status = DifficultySystem.getHazardEnableStatus(61, 1);
      
      expect(status.jellyfishEnabled).toBe(true);
    });

    it('should enable all hazards when conditions are met', () => {
      const status = DifficultySystem.getHazardEnableStatus(90, 3);
      
      expect(status.sharkEnabled).toBe(true);
      expect(status.crabEnabled).toBe(true);
      expect(status.jellyfishEnabled).toBe(true);
    });
  });
});