/**
 * Difficulty System
 * Manages game difficulty progression over time
 */

import { DifficultyConfig } from '../types';
import { DIFFICULTY_CONFIG } from '../constants';

export class DifficultySystem {
  /**
   * Calculate difficulty configuration based on elapsed time and player tier
   * @param elapsedTime - Time elapsed in seconds since game start
   * @param playerTier - Current player tier (1-5)
   * @returns Complete difficulty configuration
   */
  static calculateDifficulty(elapsedTime: number, playerTier: number): DifficultyConfig {
    // Calculate progress through difficulty curve (0 to 1 over 5 minutes)
    const difficultyProgress = Math.min(elapsedTime / DIFFICULTY_CONFIG.maxDifficultyTime, 1.0);
    
    // Calculate fish spawn rate (0.8 to 2.0 over 5 minutes)
    const fishSpawnRate = this.lerp(
      DIFFICULTY_CONFIG.fishSpawnRateMin,
      DIFFICULTY_CONFIG.fishSpawnRateMax,
      difficultyProgress
    );
    
    // Calculate fish speed multiplier (1.0 to 1.5)
    const fishSpeedMultiplier = this.lerp(
      DIFFICULTY_CONFIG.fishSpeedMultiplierMin,
      DIFFICULTY_CONFIG.fishSpeedMultiplierMax,
      difficultyProgress
    );
    
    // Calculate large fish ratio (0.2 to 0.5)
    const largeFishRatio = this.lerp(
      DIFFICULTY_CONFIG.largeFishRatioMin,
      DIFFICULTY_CONFIG.largeFishRatioMax,
      difficultyProgress
    );
    
    // Calculate shark speed based on difficulty progress (120 to 200)
    const sharkSpeed = this.lerp(120, 200, difficultyProgress);
    
    // Determine hazard enable conditions
    const sharkEnabled = elapsedTime >= DIFFICULTY_CONFIG.sharkEnableTime;
    const crabEnabled = playerTier >= DIFFICULTY_CONFIG.crabEnableTier;
    const jellyfishEnabled = elapsedTime >= DIFFICULTY_CONFIG.jellyfishEnableTime;
    
    // Calculate jellyfish count (0 to 3 based on time)
    let jellyfishCount = 0;
    if (jellyfishEnabled) {
      // Gradually increase jellyfish count over time after they're enabled
      const jellyfishProgress = Math.min((elapsedTime - DIFFICULTY_CONFIG.jellyfishEnableTime) / 120, 1.0); // 2 minutes to reach max
      jellyfishCount = Math.min(Math.floor(jellyfishProgress * 3) + 1, 3); // 1 to 3 jellyfish, capped at 3
    }
    
    return {
      fishSpawnRate,
      fishSpeedMultiplier,
      sharkEnabled,
      sharkSpeed,
      crabEnabled,
      jellyfishEnabled,
      jellyfishCount,
      largeFishRatio,
    };
  }
  
  /**
   * Linear interpolation between two values
   * @param start - Starting value
   * @param end - Ending value
   * @param progress - Progress from 0 to 1
   * @returns Interpolated value
   */
  private static lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }
  
  /**
   * Check if hazards should be enabled based on conditions
   * @param elapsedTime - Time elapsed in seconds
   * @param playerTier - Current player tier
   * @returns Object indicating which hazards are enabled
   */
  static getHazardEnableStatus(elapsedTime: number, playerTier: number): {
    sharkEnabled: boolean;
    crabEnabled: boolean;
    jellyfishEnabled: boolean;
  } {
    return {
      sharkEnabled: elapsedTime >= DIFFICULTY_CONFIG.sharkEnableTime,
      crabEnabled: playerTier >= DIFFICULTY_CONFIG.crabEnableTier,
      jellyfishEnabled: elapsedTime >= DIFFICULTY_CONFIG.jellyfishEnableTime,
    };
  }
}