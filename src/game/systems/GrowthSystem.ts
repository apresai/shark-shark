/**
 * Growth System for Shark Shark
 * Handles player tier calculation based on fish eaten count
 */

import { PlayerState } from '@/game/types';
import { TIER_THRESHOLDS, TIER_DIMENSIONS, MAX_TIER } from '@/game/constants';

/**
 * Growth System class for handling player tier progression
 */
export class GrowthSystem {
  /**
   * Calculate the appropriate tier based on fish eaten count
   * @param fishEaten Number of fish eaten by the player
   * @returns The tier (1-5) that corresponds to the fish count
   */
  static calculateTier(fishEaten: number): 1 | 2 | 3 | 4 | 5 {
    // Start from the highest tier and work down to find the appropriate tier
    for (let tier = MAX_TIER; tier >= 1; tier--) {
      if (fishEaten >= TIER_THRESHOLDS[tier]) {
        return tier as 1 | 2 | 3 | 4 | 5;
      }
    }
    
    // Fallback to tier 1 (should never reach here given TIER_THRESHOLDS[1] = 0)
    return 1;
  }

  /**
   * Check if the player should tier up based on current fish count
   * @param player Current player state
   * @returns Object containing whether tier up occurred and the new tier
   */
  static checkTierUp(player: PlayerState): { tierUp: boolean; newTier: 1 | 2 | 3 | 4 | 5 } {
    const calculatedTier = this.calculateTier(player.fishEaten);
    const tierUp = calculatedTier > player.tier;
    
    return {
      tierUp,
      newTier: calculatedTier,
    };
  }

  /**
   * Apply tier up to player state, updating tier and dimensions
   * @param player Current player state
   * @param newTier The new tier to apply
   */
  static applyTierUp(player: PlayerState, newTier: 1 | 2 | 3 | 4 | 5): void {
    player.tier = newTier;
    
    // Update player dimensions based on new tier
    const dimensions = TIER_DIMENSIONS[newTier];
    player.width = dimensions.width;
    player.height = dimensions.height;
  }

  /**
   * Get the number of fish needed to reach the next tier
   * @param currentTier Current player tier
   * @returns Number of fish needed for next tier, or 0 if already at max tier
   */
  static getFishNeededForNextTier(currentTier: number): number {
    if (currentTier >= MAX_TIER) {
      return 0; // Already at max tier
    }
    
    const nextTier = currentTier + 1;
    return TIER_THRESHOLDS[nextTier];
  }

  /**
   * Get progress towards next tier as a percentage
   * @param fishEaten Current fish eaten count
   * @param currentTier Current player tier
   * @returns Progress percentage (0-1), or 1 if at max tier
   */
  static getTierProgress(fishEaten: number, currentTier: number): number {
    if (currentTier >= MAX_TIER) {
      return 1; // Already at max tier
    }
    
    const currentTierThreshold = TIER_THRESHOLDS[currentTier];
    const nextTierThreshold = TIER_THRESHOLDS[currentTier + 1];
    
    const progressInCurrentTier = fishEaten - currentTierThreshold;
    const fishNeededForNextTier = nextTierThreshold - currentTierThreshold;
    
    return Math.min(progressInCurrentTier / fishNeededForNextTier, 1);
  }

  /**
   * Complete growth system update for player
   * Checks for tier up and applies it if necessary
   * @param player Current player state
   * @returns Whether a tier up occurred
   */
  static updatePlayerGrowth(player: PlayerState): boolean {
    const { tierUp, newTier } = this.checkTierUp(player);
    
    if (tierUp) {
      this.applyTierUp(player, newTier);
    }
    
    return tierUp;
  }
}