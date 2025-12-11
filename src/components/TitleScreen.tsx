/**
 * TitleScreen Component
 * 
 * Displays the game title screen with start button, high scores, and theme selection.
 * 
 * Requirements: 10.1, 1.1, 1.3, 6.2, 6.3
 * - WHEN the game initializes THEN the Game State SHALL display the title screen with a start option
 * - WHEN the user opens the title screen THEN the Game SHALL display a theme selection option
 * - WHEN a theme is selected THEN the Game SHALL immediately preview the theme by updating visible UI elements
 * - WHEN sprites are loading THEN the Game SHALL display a loading indicator
 * - WHEN all sprites are loaded THEN the Game SHALL enable the start game option
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { HighScoreEntry, ThemeId, ThemeInfo } from '../game/types';
import { ThemeSelector } from './ThemeSelector';
import { themeManager } from '../game/ThemeManager';
import { spriteLoader } from '../game/SpriteLoader';

export interface TitleScreenProps {
  /** High score entries to display */
  highScores: HighScoreEntry[];
  /** Callback when start button is clicked */
  onStart: () => void;
}

/**
 * Format score with commas for readability
 * Uses a consistent format to avoid hydration mismatches between server and client
 */
function formatScore(score: number): string {
  return score.toLocaleString('en-US');
}

/**
 * Format timestamp to readable date
 * Uses a consistent format to avoid hydration mismatches between server and client
 */
function formatDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US');
  } catch {
    return '';
  }
}

export function TitleScreen({ highScores, onStart }: TitleScreenProps) {
  const topScore = highScores.length > 0 ? highScores[0] : null;
  
  // Theme state
  const [availableThemes, setAvailableThemes] = useState<ThemeInfo[]>([]);
  const [activeTheme, setActiveTheme] = useState<ThemeId>('classic');
  const [isLoadingSprites, setIsLoadingSprites] = useState(false);
  const [spritesLoaded, setSpritesLoaded] = useState(false);

  // Initialize theme state on mount
  useEffect(() => {
    setAvailableThemes(themeManager.getAvailableThemes());
    setActiveTheme(themeManager.getActiveTheme());
    
    // Check if sprites are already loaded
    setSpritesLoaded(spriteLoader.isLoaded());
    
    // Subscribe to theme changes
    const unsubscribe = themeManager.onThemeChange((newTheme) => {
      setActiveTheme(newTheme);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Load sprites on initial mount if not already loaded
  useEffect(() => {
    if (!spriteLoader.isLoaded()) {
      setIsLoadingSprites(true);
      spriteLoader.loadAll()
        .then(() => {
          setSpritesLoaded(true);
          setIsLoadingSprites(false);
        })
        .catch((err) => {
          console.warn('Failed to load sprites:', err);
          setIsLoadingSprites(false);
          // Still allow gameplay even if some sprites failed
          setSpritesLoaded(true);
        });
    }
  }, []);

  // Handle theme selection
  const handleSelectTheme = useCallback(async (themeId: ThemeId) => {
    if (themeId === activeTheme) return;
    
    setIsLoadingSprites(true);
    setSpritesLoaded(false);
    
    try {
      // Update theme in manager (persists to localStorage)
      await themeManager.setActiveTheme(themeId);
      
      // Load sprites for the new theme
      await spriteLoader.loadTheme(themeId);
      
      setSpritesLoaded(true);
    } catch (err) {
      console.warn('Failed to load theme sprites:', err);
      // Still allow gameplay even if some sprites failed
      setSpritesLoaded(true);
    } finally {
      setIsLoadingSprites(false);
    }
  }, [activeTheme]);

  // Determine if start button should be enabled
  const canStart = spritesLoaded && !isLoadingSprites;

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
        
        {/* Theme Selector */}
        <ThemeSelector
          themes={availableThemes}
          activeTheme={activeTheme}
          onSelectTheme={handleSelectTheme}
          disabled={isLoadingSprites}
        />
        
        {/* Loading Indicator */}
        {isLoadingSprites && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner} />
            <span style={styles.loadingText}>Loading theme...</span>
          </div>
        )}
        
        {/* Start Button */}
        <button 
          style={{
            ...styles.startButton,
            ...(canStart ? {} : styles.startButtonDisabled),
          }}
          onClick={canStart ? onStart : undefined}
          disabled={!canStart}
          onMouseEnter={(e) => {
            if (canStart) {
              e.currentTarget.style.backgroundColor = '#00aa66';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (canStart) {
              e.currentTarget.style.backgroundColor = '#00ff88';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {isLoadingSprites ? 'LOADING...' : 'START GAME'}
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
  startButtonDisabled: {
    backgroundColor: '#666666',
    color: '#999999',
    cursor: 'not-allowed',
    boxShadow: '0 5px 0 #444444',
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
