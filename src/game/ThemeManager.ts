/**
 * ThemeManager - Singleton for managing game themes
 * 
 * Handles theme state, persistence to localStorage, and coordination
 * with other components through change subscriptions.
 */

import { ThemeId, ThemeInfo, GameStatus } from './types';
import { THEME_REGISTRY, isValidThemeId } from './themes/themeRegistry';

const STORAGE_KEY = 'shark-shark-theme';
const DEFAULT_THEME: ThemeId = 'classic';

type ThemeChangeCallback = (themeId: ThemeId) => void;

class ThemeManager {
  private static instance: ThemeManager;
  private activeTheme: ThemeId;
  private subscribers: Set<ThemeChangeCallback>;

  private constructor() {
    this.subscribers = new Set();
    this.activeTheme = this.loadThemeFromStorage();
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Reset the singleton instance (for testing purposes)
   */
  static resetInstance(): void {
    ThemeManager.instance = undefined as unknown as ThemeManager;
  }

  /**
   * Get list of all available themes
   */
  getAvailableThemes(): ThemeInfo[] {
    return Object.values(THEME_REGISTRY);
  }

  /**
   * Get currently active theme
   */
  getActiveTheme(): ThemeId {
    return this.activeTheme;
  }

  /**
   * Set active theme (persists to local storage)
   */
  async setActiveTheme(themeId: ThemeId): Promise<void> {
    if (!isValidThemeId(themeId)) {
      console.warn(`Invalid theme ID: ${themeId}, falling back to ${DEFAULT_THEME}`);
      themeId = DEFAULT_THEME;
    }

    const themeChanged = this.activeTheme !== themeId;
    this.activeTheme = themeId;
    
    // Always persist to storage
    this.saveThemeToStorage(themeId);
    
    // Only notify subscribers if theme actually changed
    if (themeChanged) {
      this.notifySubscribers(themeId);
    }
  }

  /**
   * Check if theme switching is allowed
   * Returns false when game status is "playing"
   */
  canSwitchTheme(gameStatus: GameStatus): boolean {
    return gameStatus !== 'playing';
  }

  /**
   * Subscribe to theme changes
   * Returns an unsubscribe function
   */
  onThemeChange(callback: ThemeChangeCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Load theme from localStorage
   * Falls back to default if stored theme is invalid
   */
  private loadThemeFromStorage(): ThemeId {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return DEFAULT_THEME;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isValidThemeId(stored)) {
        return stored;
      }

      // Clear invalid value if present
      if (stored) {
        console.warn(`Invalid theme in localStorage: ${stored}, clearing and using default`);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
    }

    return DEFAULT_THEME;
  }

  /**
   * Save theme to localStorage
   */
  private saveThemeToStorage(themeId: ThemeId): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }

  /**
   * Notify all subscribers of theme change
   */
  private notifySubscribers(themeId: ThemeId): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(themeId);
      } catch (error) {
        console.error('Error in theme change callback:', error);
      }
    });
  }
}

// Export singleton instance
export const themeManager = ThemeManager.getInstance();
export default ThemeManager;
export { STORAGE_KEY, DEFAULT_THEME };
