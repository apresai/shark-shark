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
import { SignInButton } from './SignInButton';
import { LeaderboardPanel } from './LeaderboardPanel';

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

  // Leaderboard toggle state
  const [showGlobalLeaderboard, setShowGlobalLeaderboard] = useState(true);

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
      {/* Sign In Button - Fixed at top right */}
      <div style={styles.signInContainer}>
        <SignInButton />
      </div>

      <div style={styles.container}>
        {/* Game Title */}
        <div style={styles.titleSection}>
          <h1 style={styles.title}>SHARK</h1>
          <h1 style={styles.titleSecond}>SHARK</h1>
          <p style={styles.subtitle}>🦈 Eat or Be Eaten 🐟</p>
        </div>

        {/* Leaderboard Section */}
        <div style={styles.leaderboardSection}>
          {/* Toggle Buttons */}
          <div style={styles.leaderboardToggle}>
            <button
              onClick={() => setShowGlobalLeaderboard(true)}
              style={{
                ...styles.toggleButton,
                ...(showGlobalLeaderboard ? styles.toggleButtonActive : {}),
              }}
            >
              GLOBAL
            </button>
            <button
              onClick={() => setShowGlobalLeaderboard(false)}
              style={{
                ...styles.toggleButton,
                ...(!showGlobalLeaderboard ? styles.toggleButtonActive : {}),
              }}
            >
              LOCAL
            </button>
          </div>

          {/* Leaderboard Content */}
          {showGlobalLeaderboard ? (
            <LeaderboardPanel compact />
          ) : (
            <>
              {/* Local High Score Banner */}
              {topScore && (
                <div style={styles.topScoreBanner}>
                  <span style={styles.topScoreLabel}>🏆 LOCAL HIGH SCORE</span>
                  <span style={styles.topScoreValue}>{formatScore(topScore.score)}</span>
                </div>
              )}
            </>
          )}
        </div>

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
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 20, 40, 0.95)',
    zIndex: 100,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  signInContainer: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 101,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'clamp(12px, 2vh, 24px)',
    padding: 'clamp(20px, 4vh, 40px)',
    paddingTop: 'clamp(60px, 8vh, 80px)',
    paddingBottom: 'clamp(20px, 4vh, 40px)',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    color: '#ffffff',
    textAlign: 'center',
    minHeight: '100%',
    boxSizing: 'border-box',
  },
  titleSection: {
    marginBottom: 'clamp(4px, 1vh, 8px)',
  },
  title: {
    fontSize: 'clamp(32px, 8vw, 64px)',
    color: '#00ff88',
    margin: 0,
    textShadow: '3px 3px 0 #006644, 5px 5px 0 #003322',
    letterSpacing: 'clamp(4px, 1vw, 10px)',
  },
  titleSecond: {
    fontSize: 'clamp(32px, 8vw, 64px)',
    color: '#ff6644',
    margin: '-8px 0 0 0',
    textShadow: '3px 3px 0 #993322, 5px 5px 0 #661100',
    letterSpacing: 'clamp(4px, 1vw, 10px)',
  },
  subtitle: {
    fontSize: 'clamp(12px, 2vw, 18px)',
    color: '#88ccff',
    marginTop: 'clamp(12px, 2vh, 24px)',
  },
  topScoreBanner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: 'clamp(12px, 2vh, 16px) clamp(20px, 4vw, 32px)',
    backgroundColor: 'rgba(255, 204, 0, 0.15)',
    borderRadius: '12px',
    border: '2px solid #ffcc00',
  },
  topScoreLabel: {
    fontSize: 'clamp(10px, 1.5vw, 16px)',
    color: '#ffcc00',
    letterSpacing: '2px',
  },
  topScoreValue: {
    fontSize: 'clamp(24px, 4vw, 36px)',
    color: '#ffffff',
    textShadow: '2px 2px 0 #000000',
  },
  leaderboardSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'clamp(8px, 1.5vh, 12px)',
    width: '100%',
    maxWidth: 'min(400px, 90vw)',
  },
  leaderboardToggle: {
    display: 'flex',
    gap: '8px',
  },
  toggleButton: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: 'clamp(8px, 1.2vw, 10px)',
    padding: 'clamp(6px, 1vh, 8px) clamp(12px, 2vw, 16px)',
    backgroundColor: 'rgba(0, 100, 150, 0.3)',
    color: '#88ccff',
    border: '2px solid rgba(136, 204, 255, 0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    color: '#00ff88',
    border: '2px solid #00ff88',
  },
  startButton: {
    padding: 'clamp(14px, 2.5vh, 20px) clamp(30px, 6vw, 50px)',
    fontSize: 'clamp(16px, 3vw, 24px)',
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
    fontSize: 'clamp(10px, 1.5vw, 14px)',
    color: '#88ccff',
    letterSpacing: '1px',
  },
  controls: {
    fontSize: 'clamp(10px, 1.5vw, 16px)',
    color: '#88ccff',
  },
};

export default TitleScreen;
