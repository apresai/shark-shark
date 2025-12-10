/**
 * HUD Component
 * 
 * Displays game information overlay including score, high score, lives, and tier progress.
 * 
 * Requirements: 3.1, 6.1
 * - Display score, high score, lives, current tier
 * - Show tier progress bar
 */

'use client';

import React from 'react';
import { TIER_THRESHOLDS, MAX_TIER } from '../game/constants';

export interface HUDProps {
  /** Current player score */
  score: number;
  /** High score */
  highScore: number;
  /** Current number of lives */
  lives: number;
  /** Current player tier (1-5) */
  tier: 1 | 2 | 3 | 4 | 5;
  /** Number of fish eaten in current tier */
  fishEaten: number;
}

/**
 * Calculate tier progress percentage
 */
function calculateTierProgress(tier: number, fishEaten: number): number {
  if (tier >= MAX_TIER) {
    return 100; // Max tier, always full
  }
  
  const currentThreshold = TIER_THRESHOLDS[tier];
  const nextThreshold = TIER_THRESHOLDS[tier + 1];
  const fishInTier = fishEaten - currentThreshold;
  const fishNeeded = nextThreshold - currentThreshold;
  
  return Math.min(100, Math.floor((fishInTier / fishNeeded) * 100));
}

/**
 * Format score with commas for readability
 */
function formatScore(score: number): string {
  return score.toLocaleString();
}

export function HUD({ score, highScore, lives, tier, fishEaten }: HUDProps) {
  const tierProgress = calculateTierProgress(tier, fishEaten);
  
  return (
    <div className="hud-container" style={styles.container}>
      {/* Top row: Score and High Score */}
      <div style={styles.topRow}>
        <div style={styles.scoreSection}>
          <span style={styles.label}>SCORE</span>
          <span style={styles.scoreValue}>{formatScore(score)}</span>
        </div>
        <div style={styles.scoreSection}>
          <span style={styles.label}>HIGH</span>
          <span style={styles.highScoreValue}>{formatScore(highScore)}</span>
        </div>
      </div>
      
      {/* Bottom row: Lives and Tier */}
      <div style={styles.bottomRow}>
        {/* Lives display */}
        <div style={styles.livesSection}>
          <span style={styles.label}>LIVES</span>
          <div style={styles.livesIcons}>
            {Array.from({ length: lives }, (_, i) => (
              <span key={i} style={styles.lifeIcon}>🐟</span>
            ))}
          </div>
        </div>
        
        {/* Tier progress */}
        <div style={styles.tierSection}>
          <span style={styles.label}>TIER {tier}</span>
          <div style={styles.progressBarContainer}>
            <div 
              style={{
                ...styles.progressBarFill,
                width: `${tierProgress}%`,
              }}
            />
          </div>
          {tier < MAX_TIER && (
            <span style={styles.progressText}>
              {fishEaten - TIER_THRESHOLDS[tier]}/{TIER_THRESHOLDS[tier + 1] - TIER_THRESHOLDS[tier]}
            </span>
          )}
          {tier >= MAX_TIER && (
            <span style={styles.progressText}>MAX</span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: '16px 32px',
    pointerEvents: 'none',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    color: '#ffffff',
    textShadow: '3px 3px 0 #000000',
    zIndex: 10,
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  bottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '20px',
    color: '#88ccff',
    letterSpacing: '2px',
  },
  scoreValue: {
    fontSize: '36px',
    color: '#ffffff',
  },
  highScoreValue: {
    fontSize: '28px',
    color: '#ffcc00',
  },
  livesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  livesIcons: {
    display: 'flex',
    gap: '8px',
  },
  lifeIcon: {
    fontSize: '32px',
  },
  tierSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
    maxWidth: '140px',
  },
  progressBarContainer: {
    width: '120px',
    height: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #88ccff',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    transition: 'width 0.3s ease-out',
  },
  progressText: {
    fontSize: '16px',
    color: '#88ccff',
  },
};

export default HUD;
