/**
 * Scoring System for Shark Shark
 * Handles all score calculations, extra life thresholds, and high score persistence
 */

import { FishEntity, HighScoreEntry, HighScoreTable } from '@/game/types';
import { 
  FISH_POINTS, 
  SHARK_CONFIG, 
  SEAHORSE_CONFIG,
  EXTRA_LIFE_THRESHOLDS,
  EXTRA_LIFE_INTERVAL_AFTER_100K,
  HIGH_SCORE_MAX_ENTRIES,
  HIGH_SCORE_STORAGE_KEY
} from '@/game/constants';

/**
 * Scoring System class for handling all scoring operations
 */
export class ScoringSystem {
  /**
   * Calculate points for eating a fish with tier multiplier
   * @param fish The fish entity that was eaten
   * @param playerTier Current player tier (1-5)
   * @returns Points awarded for eating the fish
   */
  static calculateFishPoints(fish: FishEntity, playerTier: number): number {
    const basePoints = FISH_POINTS[fish.size];
    return basePoints * playerTier;
  }

  /**
   * Get points for biting shark tail (flat 500 points)
   * @returns Points awarded for shark tail bite
   */
  static getSharkTailPoints(): number {
    return SHARK_CONFIG.tailPoints;
  }

  /**
   * Get points for collecting seahorse (flat 200 points)
   * @returns Points awarded for seahorse collection
   */
  static getSeahorsePoints(): number {
    return SEAHORSE_CONFIG.points;
  }

  /**
   * Check if a score crosses any extra life thresholds
   * @param previousScore Score before the points were added
   * @param newScore Score after the points were added
   * @returns Number of extra lives earned (0 or more)
   */
  static checkExtraLifeThresholds(previousScore: number, newScore: number): number {
    let extraLives = 0;

    // Check initial thresholds (10k, 30k, 60k, 100k)
    for (const threshold of EXTRA_LIFE_THRESHOLDS) {
      if (previousScore < threshold && newScore >= threshold) {
        extraLives++;
      }
    }

    // Check intervals after 100k (every 50k: 150k, 200k, 250k, etc.)
    if (newScore > 100000) {
      // Calculate which 50k intervals were crossed
      const startInterval = Math.max(100000, previousScore);
      const endInterval = newScore;
      
      // Count how many 50k thresholds were crossed
      let currentThreshold = 150000; // First threshold after 100k
      while (currentThreshold <= endInterval) {
        if (startInterval < currentThreshold) {
          extraLives++;
        }
        currentThreshold += EXTRA_LIFE_INTERVAL_AFTER_100K;
      }
    }

    return extraLives;
  }

  /**
   * Load high scores from localStorage
   * @returns High score table with entries sorted by score (descending)
   */
  static loadHighScores(): HighScoreTable {
    try {
      const stored = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
      if (!stored) {
        return { entries: [] };
      }

      const parsed = JSON.parse(stored) as HighScoreTable;
      
      // Validate and sort entries
      const validEntries = parsed.entries
        .filter(entry => 
          typeof entry.score === 'number' && 
          typeof entry.tier === 'number' && 
          typeof entry.fishEaten === 'number' &&
          typeof entry.timestamp === 'string'
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, HIGH_SCORE_MAX_ENTRIES);

      return { entries: validEntries };
    } catch (error) {
      console.warn('Failed to load high scores from localStorage:', error);
      return { entries: [] };
    }
  }

  /**
   * Save high scores to localStorage
   * @param highScores High score table to save
   */
  static saveHighScores(highScores: HighScoreTable): void {
    try {
      // Ensure entries are sorted and limited
      const sortedEntries = highScores.entries
        .sort((a, b) => b.score - a.score)
        .slice(0, HIGH_SCORE_MAX_ENTRIES);

      const tableToSave: HighScoreTable = { entries: sortedEntries };
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(tableToSave));
    } catch (error) {
      console.warn('Failed to save high scores to localStorage:', error);
    }
  }

  /**
   * Check if a score qualifies for the high score table
   * @param score Score to check
   * @param highScores Current high score table
   * @returns True if the score qualifies for top 10
   */
  static qualifiesForHighScore(score: number, highScores: HighScoreTable): boolean {
    // If table has fewer than max entries, score always qualifies
    if (highScores.entries.length < HIGH_SCORE_MAX_ENTRIES) {
      return true;
    }

    // Check if score is higher than the lowest entry
    const lowestScore = highScores.entries[highScores.entries.length - 1].score;
    return score > lowestScore;
  }

  /**
   * Add a new high score entry to the table
   * @param score Final score
   * @param tier Final tier achieved
   * @param fishEaten Total fish eaten
   * @param highScores Current high score table
   * @returns Updated high score table
   */
  static addHighScore(
    score: number, 
    tier: number, 
    fishEaten: number, 
    highScores: HighScoreTable
  ): HighScoreTable {
    const newEntry: HighScoreEntry = {
      score,
      tier,
      fishEaten,
      timestamp: new Date().toISOString(),
    };

    const updatedEntries = [...highScores.entries, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, HIGH_SCORE_MAX_ENTRIES);

    return { entries: updatedEntries };
  }

  /**
   * Complete high score persistence workflow
   * Checks qualification, adds entry if qualified, and saves to localStorage
   * @param score Final score
   * @param tier Final tier achieved
   * @param fishEaten Total fish eaten
   * @returns True if the score was added to high scores
   */
  static persistHighScore(score: number, tier: number, fishEaten: number): boolean {
    const currentHighScores = this.loadHighScores();
    
    if (this.qualifiesForHighScore(score, currentHighScores)) {
      const updatedHighScores = this.addHighScore(score, tier, fishEaten, currentHighScores);
      this.saveHighScores(updatedHighScores);
      return true;
    }
    
    return false;
  }
}