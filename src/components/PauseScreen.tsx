/**
 * PauseScreen Component
 * 
 * Displays a pause overlay with resume option and theme selection.
 * 
 * Requirements: 10.2, 10.3, 5.2, 5.3
 * - WHEN the player presses ESC or the browser loses focus during gameplay THEN the Game State SHALL transition to paused
 * - WHEN the player presses ESC or clicks resume while paused THEN the Game State SHALL transition to playing
 * - WHEN the game is paused THEN the Game SHALL allow theme switching from the pause menu
 * - WHEN a theme is changed during pause THEN the Game SHALL apply the new theme when gameplay resumes
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { ThemeId, ThemeInfo } from '../game/types';
import { ThemeSelector } from './ThemeSelector';
import { themeManager } from '../game/ThemeManager';
import { spriteLoader } from '../game/SpriteLoader';

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
  // Theme state
  const [availableThemes, setAvailableThemes] = useState<ThemeInfo[]>([]);
  const [activeTheme, setActiveTheme] = useState<ThemeId>('classic');
  const [isLoadingSprites, setIsLoadingSprites] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<ThemeId | null>(null);

  // Initialize theme state on mount
  useEffect(() => {
    setAvailableThemes(themeManager.getAvailableThemes());
    setActiveTheme(themeManager.getActiveTheme());
    
    // Subscribe to theme changes
    const unsubscribe = themeManager.onThemeChange((newTheme) => {
      setActiveTheme(newTheme);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Handle theme selection
  const handleSelectTheme = useCallback(async (themeId: ThemeId) => {
    if (themeId === activeTheme) return;
    
    setIsLoadingSprites(true);
    setPendingTheme(themeId);
    
    try {
      // Update theme in manager (persists to localStorage)
      await themeManager.setActiveTheme(themeId);
      
      // Load sprites for the new theme
      await spriteLoader.loadTheme(themeId);
    } catch (err) {
      console.warn('Failed to load theme sprites:', err);
    } finally {
      setIsLoadingSprites(false);
      setPendingTheme(null);
    }
  }, [activeTheme]);

  // Handle resume - theme is already applied when selected
  const handleResume = useCallback(() => {
    onResume();
  }, [onResume]);

  // Determine if resume button should be enabled
  const canResume = !isLoadingSprites;

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
        
        {/* Theme Selector */}
        <ThemeSelector
          themes={availableThemes}
          activeTheme={activeTheme}
          onSelectTheme={handleSelectTheme}
          disabled={isLoadingSprites}
        />
        
        {/* Loading Indicator */}
        {isLoadingSprites && pendingTheme && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner} />
            <span style={styles.loadingText}>Loading theme...</span>
          </div>
        )}
        
        {/* Resume Button */}
        <button 
          style={{
            ...styles.resumeButton,
            ...(canResume ? {} : styles.resumeButtonDisabled),
          }}
          onClick={canResume ? handleResume : undefined}
          disabled={!canResume}
          onMouseEnter={(e) => {
            if (canResume) {
              e.currentTarget.style.backgroundColor = '#00aa66';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (canResume) {
              e.currentTarget.style.backgroundColor = '#00ff88';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {isLoadingSprites ? 'LOADING...' : 'RESUME'}
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
  resumeButtonDisabled: {
    backgroundColor: '#666666',
    color: '#999999',
    cursor: 'not-allowed',
    boxShadow: '0 6px 0 #444444',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    backgroundColor: 'rgba(0, 100, 150, 0.3)',
    borderRadius: '8px',
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(136, 204, 255, 0.3)',
    borderTop: '3px solid #88ccff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#88ccff',
    letterSpacing: '1px',
  },
  instructions: {
    fontSize: '18px',
    color: '#88ccff',
    marginTop: '16px',
  },
};

export default PauseScreen;
