/**
 * ThemeSelector Component
 * 
 * Displays a list of available themes and allows the user to select one.
 * Highlights the currently active theme and supports disabled state during gameplay.
 * 
 * Requirements: 1.1, 3.1, 3.2
 * - WHEN the user opens the title screen THEN the Game SHALL display a theme selection option
 * - WHEN the theme selector is displayed THEN the Game SHALL show a list of all available themes with their names
 * - WHEN displaying theme options THEN the Game SHALL indicate which theme is currently active
 */

'use client';

import React from 'react';
import type { ThemeId, ThemeInfo } from '../game/types';

export interface ThemeSelectorProps {
  /** List of available themes */
  themes: ThemeInfo[];
  /** Currently active theme ID */
  activeTheme: ThemeId;
  /** Callback when user selects a theme */
  onSelectTheme: (themeId: ThemeId) => void;
  /** Whether selection is disabled (e.g., during gameplay) */
  disabled?: boolean;
}

export function ThemeSelector({
  themes,
  activeTheme,
  onSelectTheme,
  disabled = false,
}: ThemeSelectorProps) {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🎨 Theme</h3>
      <div style={styles.themeList}>
        {themes.map((theme) => {
          const isActive = theme.id === activeTheme;
          return (
            <button
              key={theme.id}
              style={{
                ...styles.themeButton,
                ...(isActive ? styles.activeTheme : {}),
                ...(disabled ? styles.disabledTheme : {}),
              }}
              onClick={() => !disabled && onSelectTheme(theme.id)}
              disabled={disabled}
              aria-pressed={isActive}
              aria-label={`Select ${theme.name} theme${isActive ? ' (currently active)' : ''}`}
            >
              <span style={styles.themeName}>{theme.name}</span>
              {isActive && <span style={styles.activeIndicator}>✓</span>}
            </button>
          );
        })}
      </div>
      {disabled && (
        <p style={styles.disabledMessage}>
          Theme selection disabled during gameplay
        </p>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
  },
  title: {
    fontSize: '14px',
    color: '#88ccff',
    margin: 0,
    letterSpacing: '2px',
  },
  themeList: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '8px',
  },
  themeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    fontSize: '12px',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    backgroundColor: 'rgba(0, 100, 150, 0.3)',
    color: '#ffffff',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeTheme: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderColor: '#00ff88',
    color: '#00ff88',
  },
  disabledTheme: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  themeName: {
    letterSpacing: '1px',
  },
  activeIndicator: {
    fontSize: '10px',
  },
  disabledMessage: {
    fontSize: '10px',
    color: '#ff8866',
    margin: 0,
    fontStyle: 'italic',
  },
};

export default ThemeSelector;
