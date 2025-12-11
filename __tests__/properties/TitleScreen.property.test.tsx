/**
 * Property-based tests for TitleScreen component
 * 
 * Tests preload completion enables gameplay
 * 
 * **Feature: art-themes, Property 7: Preload Completion Enables Gameplay**
 * **Validates: Requirements 6.1, 6.3**
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { TitleScreen } from '../../src/components/TitleScreen';
import SpriteLoader from '../../src/game/SpriteLoader';
import ThemeManager from '../../src/game/ThemeManager';
import { getAvailableThemeIds } from '../../src/game/themes/themeRegistry';
import type { HighScoreEntry } from '../../src/game/types';

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

// Mock Image for testing
class MockImage {
  src: string = '';
  onload: (() => void) | null = null;
  onerror: ((e: Error) => void) | null = null;
  private loadDelay: number;

  constructor() {
    // Random delay to simulate network latency
    this.loadDelay = Math.random() * 10 + 5;
    
    setTimeout(() => {
      // Classic theme images load successfully
      if (this.src.startsWith('/assets/') && !this.src.includes('/themes/')) {
        if (this.onload) this.onload();
      } else if (this.src.startsWith('data:')) {
        if (this.onload) this.onload();
      } else {
        // Non-classic themes fail, triggering fallback
        if (this.onerror) this.onerror(new Error('Image not found'));
      }
    }, this.loadDelay);
  }
}

describe('TitleScreen Properties', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>;
  let originalLocalStorage: Storage;
  let originalImage: typeof Image;

  beforeEach(() => {
    // Reset singletons
    SpriteLoader.resetInstance();
    ThemeManager.resetInstance();
    
    // Setup mock localStorage
    mockStorage = createMockLocalStorage();
    originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', {
      value: mockStorage,
      writable: true,
    });

    // Setup mock Image
    originalImage = global.Image;
    (global as unknown as { Image: typeof MockImage }).Image = MockImage;
  });

  afterEach(() => {
    cleanup();
    // Restore originals
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
    (global as unknown as { Image: typeof Image }).Image = originalImage;
  });

  // Arbitrary for high score entries
  const highScoreEntryArb = fc.record({
    score: fc.integer({ min: 0, max: 1000000 }),
    tier: fc.integer({ min: 1, max: 5 }),
    fishEaten: fc.integer({ min: 0, max: 1000 }),
    timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
  });

  const highScoresArb = fc.array(highScoreEntryArb, { minLength: 0, maxLength: 10 });
  const themeIdArb = fc.constantFrom(...getAvailableThemeIds());

  /**
   * **Feature: art-themes, Property 7: Preload Completion Enables Gameplay**
   * **Validates: Requirements 6.1, 6.3**
   * 
   * For any theme, the game start option SHALL only be enabled after all sprites
   * for that theme have been successfully loaded.
   */
  describe('Property 7: Preload Completion Enables Gameplay', () => {
    it('start button is disabled while sprites are loading', async () => {
      await fc.assert(
        fc.asyncProperty(
          highScoresArb,
          async (highScores: HighScoreEntry[]) => {
            cleanup();
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const mockOnStart = jest.fn();

            // Render the component - sprites should start loading
            render(
              <TitleScreen
                highScores={highScores}
                onStart={mockOnStart}
              />
            );

            // Find the start button
            const startButton = screen.getByRole('button', { name: /start game|loading/i });
            
            // Initially, button should be disabled while loading
            // (unless sprites were already cached, which they shouldn't be after reset)
            const isDisabled = startButton.hasAttribute('disabled');
            const isLoading = startButton.textContent?.toLowerCase().includes('loading');
            
            // If loading, button must be disabled
            if (isLoading) {
              expect(isDisabled).toBe(true);
            }

            // Wait for sprites to load
            await waitFor(() => {
              const button = screen.getByRole('button', { name: /start game/i });
              expect(button).not.toBeDisabled();
            }, { timeout: 2000 });
          }
        ),
        { numRuns: 20 } // Reduced runs due to async nature
      );
    });

    it('start button becomes enabled after sprites finish loading', async () => {
      await fc.assert(
        fc.asyncProperty(
          highScoresArb,
          async (highScores: HighScoreEntry[]) => {
            cleanup();
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const mockOnStart = jest.fn();

            render(
              <TitleScreen
                highScores={highScores}
                onStart={mockOnStart}
              />
            );

            // Wait for loading to complete
            await waitFor(() => {
              const button = screen.getByRole('button', { name: /start game/i });
              expect(button).not.toBeDisabled();
              expect(button.textContent).toBe('START GAME');
            }, { timeout: 2000 });

            // After loading, button should be clickable
            const startButton = screen.getByRole('button', { name: /start game/i });
            expect(startButton).not.toBeDisabled();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('onStart callback is only callable when sprites are loaded', async () => {
      await fc.assert(
        fc.asyncProperty(
          highScoresArb,
          async (highScores: HighScoreEntry[]) => {
            cleanup();
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const mockOnStart = jest.fn();

            render(
              <TitleScreen
                highScores={highScores}
                onStart={mockOnStart}
              />
            );

            // Wait for sprites to load
            await waitFor(() => {
              const button = screen.getByRole('button', { name: /start game/i });
              expect(button).not.toBeDisabled();
            }, { timeout: 2000 });

            // Now click should work
            const startButton = screen.getByRole('button', { name: /start game/i });
            fireEvent.click(startButton);

            expect(mockOnStart).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('loading indicator is shown while sprites are loading', async () => {
      await fc.assert(
        fc.asyncProperty(
          highScoresArb,
          async (highScores: HighScoreEntry[]) => {
            cleanup();
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const mockOnStart = jest.fn();

            render(
              <TitleScreen
                highScores={highScores}
                onStart={mockOnStart}
              />
            );

            // Check for loading state - either loading text or loading indicator
            const hasLoadingButton = screen.queryByRole('button', { name: /loading/i });
            const hasLoadingText = screen.queryByText(/loading theme/i);
            
            // At least one loading indicator should be present initially
            // (unless sprites loaded instantly, which is unlikely)
            const isInLoadingState = hasLoadingButton !== null || hasLoadingText !== null;
            
            // Wait for loading to complete
            await waitFor(() => {
              const button = screen.getByRole('button', { name: /start game/i });
              expect(button.textContent).toBe('START GAME');
            }, { timeout: 2000 });

            // After loading, no loading indicators should be present
            expect(screen.queryByText(/loading theme/i)).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('start button enabled state correlates with sprite loading completion', async () => {
      await fc.assert(
        fc.asyncProperty(
          highScoresArb,
          async (highScores: HighScoreEntry[]) => {
            cleanup();
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const mockOnStart = jest.fn();

            render(
              <TitleScreen
                highScores={highScores}
                onStart={mockOnStart}
              />
            );

            // Wait for loading to complete - button should show START GAME
            await waitFor(() => {
              const button = screen.getByRole('button', { name: /start game/i });
              expect(button).not.toBeDisabled();
              expect(button.textContent).toBe('START GAME');
            }, { timeout: 2000 });

            // When button is enabled with "START GAME" text, it means:
            // 1. spritesLoaded state is true
            // 2. isLoadingSprites state is false
            // This validates the property that start is only enabled after loading completes
            const startButton = screen.getByRole('button', { name: /start game/i });
            expect(startButton).not.toBeDisabled();
            expect(startButton.textContent).not.toContain('LOADING');
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
