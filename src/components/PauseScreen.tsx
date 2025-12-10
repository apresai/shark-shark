/**
 * PauseScreen Component
 * 
 * Displays a pause overlay with resume option.
 * 
 * Requirements: 10.2, 10.3
 * - WHEN the player presses ESC or the browser loses focus during gameplay THEN the Game State SHALL transition to paused
 * - WHEN the player presses ESC or clicks resume while paused THEN the Game State SHALL transition to playing
 */

'use client';

import React from 'react';

export interface PauseScreenProps {
  /** Callback when resume button is clicked */
  onResume: () => void;
  /** Current score to display */
  score?: number;
}

/**
 * Format score with commas for readability
 */
function formatScore(score: number): string {
  return score.toLocaleString();
}

export function PauseScreen({ onResume, score }: PauseScreenProps) {
  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        {/* Pause Title */}
        <h1 style={styles.title}>PAUSED</h1>
        
        {/* Current Score */}
        {score !== undefined && (
          <div style={styles.scoreSection}>
            <span style={styles.label}>CURRENT SCORE</span>
            <span style={styles.scoreValue}>{formatScore(score)}</span>
          </div>
        )}
        
        {/* Resume Button */}
        <button 
          style={styles.resumeButton}
          onClick={onResume}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00aa66';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00ff88';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          RESUME
        </button>
        
        {/* Instructions */}
        <p style={styles.instructions}>
          Press ESC to resume
        </p>
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
    backgroundColor: 'rgba(0, 20, 40, 0.85)',
    zIndex: 100,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px',
    padding: '50px',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    color: '#ffffff',
    textAlign: 'center',
  },
  title: {
    fontSize: '64px',
    color: '#ffcc00',
    margin: 0,
    textShadow: '6px 6px 0 #664400, 8px 8px 0 #332200',
    letterSpacing: '8px',
  },
  scoreSection: {
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
  scoreValue: {
    fontSize: '40px',
    color: '#ffffff',
  },
  resumeButton: {
    padding: '24px 60px',
    fontSize: '24px',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    backgroundColor: '#00ff88',
    color: '#001428',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 6px 0 #006644',
    marginTop: '16px',
  },
  instructions: {
    fontSize: '18px',
    color: '#88ccff',
    marginTop: '16px',
  },
};

export default PauseScreen;
