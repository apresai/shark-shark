/**
 * GameOverScreen Component
 * 
 * Displays the game over screen with final score, high scores, and restart option.
 * 
 * Requirements: 10.4, 10.5
 * - WHEN all lives are lost THEN the Game State SHALL display the game over screen with final score and high scores
 * - WHEN the player selects restart from game over THEN the Game State SHALL reset all values and transition to playing
 */

'use client';

import React, { useState } from 'react';
import type { HighScoreEntry, SaveScoreResponse } from '../game/types';
import type { WindowSize } from '../hooks/useWindowSize';
import { useWindowSize } from '../hooks/useWindowSize';
import { SignInButton } from './SignInButton';

/**
 * Responsive styles interface for GameOverScreen elements
 */
export interface ResponsiveStyles {
  title: React.CSSProperties;
  finalScoreValue: React.CSSProperties;
  statLabel: React.CSSProperties;
  statValue: React.CSSProperties;
  restartButton: React.CSSProperties;
  container: React.CSSProperties;
  statsSection: React.CSSProperties;
  highScoresSection: React.CSSProperties;
}

/**
 * Calculate responsive styles based on viewport dimensions
 * 
 * Returns desktop styles when width > 768px
 * Returns mobile styles when width <= 768px
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.3
 */
export function getResponsiveStyles(windowSize: WindowSize): ResponsiveStyles {
  const { isMobile } = windowSize;

  if (isMobile) {
    // Mobile styles (width <= 768px)
    return {
      title: {
        fontSize: '32px',
      },
      finalScoreValue: {
        fontSize: '28px',
      },
      statLabel: {
        fontSize: '12px',
      },
      statValue: {
        fontSize: '20px',
      },
      restartButton: {
        padding: '16px 40px',
        minWidth: '44px',
        minHeight: '44px',
      },
      container: {
        padding: '20px',
        gap: '16px',
      },
      statsSection: {
        gap: '30px',
      },
      highScoresSection: {},
    };
  }

  // Desktop styles (width > 768px)
  return {
    title: {
      fontSize: '56px',
    },
    finalScoreValue: {
      fontSize: '48px',
    },
    statLabel: {
      fontSize: '16px',
    },
    statValue: {
      fontSize: '32px',
    },
    restartButton: {
      padding: '24px 60px',
    },
    container: {
      padding: '40px',
      gap: '24px',
    },
    statsSection: {
      gap: '60px',
    },
    highScoresSection: {},
  };
}

export interface GameOverScreenProps {
  /** Final score achieved */
  finalScore: number;
  /** High score entries to display */
  highScores: HighScoreEntry[];
  /** Whether the final score is a new high score */
  isNewHighScore: boolean;
  /** Final tier reached */
  finalTier: number;
  /** Total fish eaten */
  fishEaten: number;
  /** Callback when restart button is clicked */
  onRestart: () => void;
  /** Whether the user is authenticated */
  isAuthenticated?: boolean;
  /** Callback to save score to global leaderboard */
  onSaveScore?: () => Promise<SaveScoreResponse>;
}

/**
 * Format score with commas for readability
 */
function formatScore(score: number): string {
  return score.toLocaleString();
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

export function GameOverScreen({
  finalScore,
  highScores,
  isNewHighScore,
  finalTier,
  fishEaten,
  onRestart,
  isAuthenticated = false,
  onSaveScore,
}: GameOverScreenProps) {
  const windowSize = useWindowSize();
  const responsiveStyles = getResponsiveStyles(windowSize);

  // Global leaderboard save state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [globalRank, setGlobalRank] = useState<number | null>(null);

  const handleSaveScore = async () => {
    if (!onSaveScore) return;
    setSaveStatus('saving');
    try {
      const result = await onSaveScore();
      if (result.success) {
        setSaveStatus('saved');
        if (result.qualified && result.rank) {
          setGlobalRank(result.rank);
        }
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.container, ...responsiveStyles.container }}>
        {/* Game Over Title */}
        <h1 style={{ ...styles.title, ...responsiveStyles.title }}>GAME OVER</h1>
        
        {/* New High Score Banner */}
        {isNewHighScore && (
          <div style={styles.newHighScore}>
            🏆 NEW HIGH SCORE! 🏆
          </div>
        )}
        
        {/* Final Score */}
        <div style={styles.finalScoreSection}>
          <span style={styles.label}>FINAL SCORE</span>
          <span style={{ ...styles.finalScoreValue, ...responsiveStyles.finalScoreValue }}>{formatScore(finalScore)}</span>
        </div>
        
        {/* Stats */}
        <div style={{ ...styles.statsSection, ...responsiveStyles.statsSection }}>
          <div style={styles.stat}>
            <span style={{ ...styles.statLabel, ...responsiveStyles.statLabel }}>TIER REACHED</span>
            <span style={{ ...styles.statValue, ...responsiveStyles.statValue }}>{finalTier}</span>
          </div>
          <div style={styles.stat}>
            <span style={{ ...styles.statLabel, ...responsiveStyles.statLabel }}>FISH EATEN</span>
            <span style={{ ...styles.statValue, ...responsiveStyles.statValue }}>{fishEaten}</span>
          </div>
        </div>

        {/* Global Leaderboard Save Section */}
        <div style={styles.saveSection}>
          {isAuthenticated ? (
            <>
              {saveStatus === 'idle' && (
                <button onClick={handleSaveScore} style={styles.saveButton}>
                  SAVE TO GLOBAL LEADERBOARD
                </button>
              )}
              {saveStatus === 'saving' && (
                <span style={styles.savingText}>Saving...</span>
              )}
              {saveStatus === 'saved' && (
                <div style={styles.savedMessage}>
                  {globalRank ? (
                    <span style={styles.rankMessage}>🏆 Ranked #{globalRank} globally!</span>
                  ) : (
                    <span style={styles.savedText}>Score saved!</span>
                  )}
                </div>
              )}
              {saveStatus === 'error' && (
                <span style={styles.errorText}>Failed to save. Try again?</span>
              )}
            </>
          ) : (
            <div style={styles.signInPrompt}>
              <span style={styles.signInText}>Sign in to save your score:</span>
              <SignInButton compact />
            </div>
          )}
        </div>

        {/* Restart Button */}
        <button 
          style={{ ...styles.restartButton, ...responsiveStyles.restartButton }}
          onClick={onRestart}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#cc5533';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ff6644';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          PLAY AGAIN
        </button>
        
        {/* High Scores */}
        {highScores.length > 0 && (
          <div style={{ ...styles.highScoresSection, ...responsiveStyles.highScoresSection }}>
            <h2 style={styles.highScoresTitle}>HIGH SCORES</h2>
            <div style={styles.highScoresList}>
              {highScores.slice(0, 5).map((entry, index) => (
                <div 
                  key={index} 
                  style={{
                    ...styles.highScoreEntry,
                    backgroundColor: entry.score === finalScore && isNewHighScore
                      ? 'rgba(255, 204, 0, 0.3)'
                      : 'rgba(0, 100, 150, 0.3)',
                  }}
                >
                  <span style={styles.rank}>{index + 1}.</span>
                  <span style={styles.entryScore}>{formatScore(entry.score)}</span>
                  <span style={styles.entryTier}>T{entry.tier}</span>
                  <span style={styles.entryDate}>{formatDate(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 0, 0, 0.95)',
    zIndex: 100,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    padding: '40px',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    color: '#ffffff',
    textAlign: 'center',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  title: {
    fontSize: '56px',
    color: '#ff4444',
    margin: 0,
    textShadow: '6px 6px 0 #880000, 8px 8px 0 #440000',
    letterSpacing: '8px',
  },
  newHighScore: {
    fontSize: '24px',
    color: '#ffcc00',
    padding: '16px 32px',
    backgroundColor: 'rgba(255, 204, 0, 0.2)',
    borderRadius: '12px',
    animation: 'pulse 1s ease-in-out infinite',
  },
  finalScoreSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  label: {
    fontSize: '20px',
    color: '#88ccff',
    letterSpacing: '2px',
  },
  finalScoreValue: {
    fontSize: '48px',
    color: '#ffffff',
    textShadow: '3px 3px 0 #000000',
  },
  statsSection: {
    display: 'flex',
    gap: '60px',
    marginTop: '16px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statLabel: {
    fontSize: '16px',
    color: '#88ccff',
  },
  statValue: {
    fontSize: '32px',
    color: '#00ff88',
  },
  restartButton: {
    padding: '24px 60px',
    fontSize: '24px',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    backgroundColor: '#ff6644',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 6px 0 #993322',
    marginTop: '16px',
  },
  saveSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'rgba(0, 100, 150, 0.2)',
    borderRadius: '12px',
    border: '1px solid rgba(136, 204, 255, 0.3)',
  },
  saveButton: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '12px',
    padding: '14px 24px',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    color: '#00ff88',
    border: '2px solid #00ff88',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  savingText: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '12px',
    color: '#88ccff',
  },
  savedMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  savedText: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '12px',
    color: '#00ff88',
  },
  rankMessage: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '14px',
    color: '#ffcc00',
    textShadow: '0 0 10px rgba(255, 204, 0, 0.5)',
  },
  errorText: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '12px',
    color: '#ff6644',
  },
  signInPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  signInText: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '10px',
    color: '#88ccff',
  },
  highScoresSection: {
    marginTop: '24px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '30vh',
  },
  highScoresTitle: {
    fontSize: '24px',
    color: '#ffcc00',
    marginBottom: '16px',
    textShadow: '3px 3px 0 #664400',
  },
  highScoresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
  },
  highScoreEntry: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '6px',
    fontSize: '16px',
  },
  rank: {
    color: '#ffcc00',
    width: '40px',
    textAlign: 'left',
  },
  entryScore: {
    color: '#ffffff',
    flex: 1,
    textAlign: 'left',
  },
  entryTier: {
    color: '#00ff88',
    width: '50px',
    textAlign: 'center',
  },
  entryDate: {
    color: '#88ccff',
    width: '120px',
    textAlign: 'right',
  },
};

export default GameOverScreen;
