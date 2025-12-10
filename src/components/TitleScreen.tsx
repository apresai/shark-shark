/**
 * TitleScreen Component
 * 
 * Displays the game title screen with start button and high scores.
 * 
 * Requirements: 10.1
 * - WHEN the game initializes THEN the Game State SHALL display the title screen with a start option
 */

'use client';

import React from 'react';
import type { HighScoreEntry } from '../game/types';

export interface TitleScreenProps {
  /** High score entries to display */
  highScores: HighScoreEntry[];
  /** Callback when start button is clicked */
  onStart: () => void;
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

export function TitleScreen({ highScores, onStart }: TitleScreenProps) {
  const topScore = highScores.length > 0 ? highScores[0] : null;
  
  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Game Title */}
        <div style={styles.titleSection}>
          <h1 style={styles.title}>SHARK</h1>
          <h1 style={styles.titleSecond}>SHARK</h1>
          <p style={styles.subtitle}>🦈 Eat or Be Eaten 🐟</p>
        </div>
        
        {/* High Score Banner - show top score prominently */}
        {topScore && (
          <div style={styles.topScoreBanner}>
            <span style={styles.topScoreLabel}>🏆 HIGH SCORE</span>
            <span style={styles.topScoreValue}>{formatScore(topScore.score)}</span>
          </div>
        )}
        
        {/* Start Button */}
        <button 
          style={styles.startButton}
          onClick={onStart}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00aa66';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00ff88';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          START GAME
        </button>
        
        <p style={styles.controls}>
          Use WASD or Arrow Keys to move
        </p>
        
        {/* Recent Scores - compact horizontal display */}
        {highScores.length > 1 && (
          <div style={styles.recentScores}>
            <span style={styles.recentLabel}>Recent:</span>
            {highScores.slice(1, 4).map((entry, index) => (
              <span key={index} style={styles.recentEntry}>
                {formatScore(entry.score)}
              </span>
            ))}
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
    backgroundColor: 'rgba(0, 20, 40, 0.95)',
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
  },
  titleSection: {
    marginBottom: '8px',
  },
  title: {
    fontSize: '64px',
    color: '#00ff88',
    margin: 0,
    textShadow: '5px 5px 0 #006644, 7px 7px 0 #003322',
    letterSpacing: '10px',
  },
  titleSecond: {
    fontSize: '64px',
    color: '#ff6644',
    margin: '-12px 0 0 0',
    textShadow: '5px 5px 0 #993322, 7px 7px 0 #661100',
    letterSpacing: '10px',
  },
  subtitle: {
    fontSize: '18px',
    color: '#88ccff',
    marginTop: '24px',
  },
  topScoreBanner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 32px',
    backgroundColor: 'rgba(255, 204, 0, 0.15)',
    borderRadius: '12px',
    border: '2px solid #ffcc00',
  },
  topScoreLabel: {
    fontSize: '16px',
    color: '#ffcc00',
    letterSpacing: '2px',
  },
  topScoreValue: {
    fontSize: '36px',
    color: '#ffffff',
    textShadow: '2px 2px 0 #000000',
  },
  startButton: {
    padding: '20px 50px',
    fontSize: '24px',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    backgroundColor: '#00ff88',
    color: '#001428',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 5px 0 #006644',
  },
  controls: {
    fontSize: '16px',
    color: '#88ccff',
  },
  recentScores: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '14px',
  },
  recentLabel: {
    color: '#88ccff',
  },
  recentEntry: {
    color: '#ffffff',
    padding: '6px 12px',
    backgroundColor: 'rgba(0, 100, 150, 0.3)',
    borderRadius: '4px',
  },
};

export default TitleScreen;
