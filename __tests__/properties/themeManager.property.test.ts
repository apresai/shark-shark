/**
 * Property-based tests for ThemeManager
 * 
 * Tests theme persistence and theme switching behavior
 */

import * as fc from 'fast-check';
import ThemeManager, { STORAGE_KEY, DEFAULT_THEME } from '../../src/game/ThemeManager';
import { getAvailableThemeIds } from '../../src/game/themes/themeRegistry';
import { ThemeId, GameStatus } from '../../src/game/types';

// Mock localStorage for testing
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
};

describe('ThemeManager Properties', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Reset ThemeManager singleton
    ThemeManager.resetInstance();
    
    // Setup mock localStorage
    mockStorage = createMockLocalStorage();
    originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  /**
   * **Feature: art-themes, Property 2: Theme Persistence Round-Trip**
   * **Validates: Requirements 2.1, 2.2**
   * 
   * For any valid theme selection, saving the theme to local storage and then 
   * retrieving it SHALL return the same theme identifier.
   */
  describe('Property 2: Theme Persistence Round-Trip', () => {
    it('saving any valid theme and retrieving it returns the same theme', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...getAvailableThemeIds()),
          async (themeId: ThemeId) => {
            // Reset for each test
            mockStorage.clear();
            ThemeManager.resetInstance();
            
            // Get fresh instance and set theme
            const manager = ThemeManager.getInstance();
            await manager.setActiveTheme(themeId);
            
            // Verify localStorage was updated
            const storedValue = mockStorage.getItem(STORAGE_KEY);
            expect(storedValue).toBe(themeId);
            
            // Reset instance to simulate page reload
            ThemeManager.resetInstance();
            
            // Get new instance - should load from storage
            const newManager = ThemeManager.getInstance();
            const retrievedTheme = newManager.getActiveTheme();
            
            // Round-trip: saved theme should equal retrieved theme
            expect(retrievedTheme).toBe(themeId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('invalid stored theme falls back to default', () => {
      fc.assert(
        fc.property(
          // Generate invalid theme IDs
          fc.string().filter(s => !getAvailableThemeIds().includes(s as ThemeId) && s.length > 0),
          (invalidThemeId: string) => {
            // Reset and set invalid value in storage
            mockStorage.clear();
            mockStorage.setItem(STORAGE_KEY, invalidThemeId);
            ThemeManager.resetInstance();
            
            // Get instance - should fall back to default
            const manager = ThemeManager.getInstance();
            const activeTheme = manager.getActiveTheme();
            
            // Should fall back to default theme
            expect(activeTheme).toBe(DEFAULT_THEME);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: art-themes, Property 5: Theme Switching Disabled During Play**
   * **Validates: Requirements 5.1**
   * 
   * For any game state where status is "playing", the canSwitchTheme function 
   * SHALL return false.
   */
  describe('Property 5: Theme Switching Disabled During Play', () => {
    const allGameStatuses: GameStatus[] = [
      'initializing',
      'title',
      'playing',
      'paused',
      'dying',
      'respawn',
      'gameover',
    ];

    it('canSwitchTheme returns false only when status is "playing"', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...allGameStatuses),
          (gameStatus: GameStatus) => {
            ThemeManager.resetInstance();
            const manager = ThemeManager.getInstance();
            
            const canSwitch = manager.canSwitchTheme(gameStatus);
            
            if (gameStatus === 'playing') {
              // Should NOT be able to switch during active gameplay
              expect(canSwitch).toBe(false);
            } else {
              // Should be able to switch in all other states
              expect(canSwitch).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('canSwitchTheme always returns false for playing status', () => {
      fc.assert(
        fc.property(
          // Generate random number of checks
          fc.integer({ min: 1, max: 10 }),
          (numChecks: number) => {
            ThemeManager.resetInstance();
            const manager = ThemeManager.getInstance();
            
            // Check multiple times - should always be false for 'playing'
            for (let i = 0; i < numChecks; i++) {
              expect(manager.canSwitchTheme('playing')).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Theme list completeness
   */
  describe('Theme List Properties', () => {
    it('getAvailableThemes returns all registered themes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getAvailableThemeIds()),
          (themeId: ThemeId) => {
            ThemeManager.resetInstance();
            const manager = ThemeManager.getInstance();
            
            const availableThemes = manager.getAvailableThemes();
            const themeIds = availableThemes.map(t => t.id);
            
            // Every registered theme should be in the available list
            expect(themeIds).toContain(themeId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
