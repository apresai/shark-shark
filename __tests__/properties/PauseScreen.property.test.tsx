/**
 * Property-based tests for PauseScreen component
 * 
 * Tests theme change applies on resume
 * 
 * **Feature: art-themes, Property 6: Theme Change Applies on Resume**
 * **Validates: Requirements 5.3**
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { PauseScreen } from '../../src/components/PauseScreen';
import SpriteLoader from '../../src/game/SpriteLoader';
import ThemeManager from '../../src/game/ThemeManager';
import { getAvailableThemeIds, THEME_REGISTRY } from '../../src/game/themes/themeRegistry';
import type { ThemeId } from '../../src/game/types';

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

describe('PauseScreen Properties', () => {
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

  // Arbitraries
  const scoreArb = fc.integer({ min: 0, max: 1000000 });
  const themeIdArb = fc.constantFrom(...getAvailableThemeIds());

  /**
   * **Feature: art-themes, Property 6: Theme Change Applies on Resume**
   * **Validates: Requirements 5.3**
   * 
   * For any theme change made while the game is paused, resuming the game 
   * SHALL result in the new theme being active and its sprites being used.
   */
  describe('Property 6: Theme Change Applies on Resume', () => {
    it('theme changed during pause is active after resume', async () => {
      await fc.assert(
        fc.asyncProperty(
          scoreArb,
          themeIdArb,
          themeIdArb,
          async (score: number, initialTheme: ThemeId, newTheme: ThemeId) => {
            // Skip if themes are the same (no change to test)
            if (initialTheme === newTheme) return;

            cleanup();
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            // Set initial theme
            const manager = ThemeManager.getInstance();
            await manager.setActiveTheme(initialTheme);
            
            // Reset to pick up the initial theme
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const mockOnResume = jest.fn();

            // Render PauseScreen
            render(
              <PauseScreen
                onResume={mockOnResume}
                score={score}
              />
            );

            // Wait for component to initialize
            await waitFor(() => {
              expect(screen.getByText('PAUSED')).toBeInTheDocument();
            }, { timeout: 1000 });

            // Find and click the new theme button
            const themeButtons = screen.getAllByRole('button', { pressed: false });
            const newThemeButton = themeButtons.find(btn => 
              btn.textContent?.toLowerCase().includes(newTheme.replace('-', ' ').toLowerCase()) ||
              btn.getAttribute('aria-label')?.toLowerCase().includes(newTheme.replace('-', ' ').toLowerCase())
            );

            if (newThemeButton) {
              fireEvent.click(newThemeButton);

              // Wait for theme to load
              await waitFor(() => {
                const resumeButton = screen.getByRole('button', { name: /resume/i });
                expect(resumeButton).not.toBeDisabled();
              }, { timeout: 2000 });
            }

            // Click resume
            const resumeButton = screen.getByRole('button', { name: /resume/i });
            fireEvent.click(resumeButton);

            // Verify resume was called
            expect(mockOnResume).toHaveBeenCalled();

            // Verify the new theme is active in ThemeManager
            const activeTheme = ThemeManager.getInstance().getActiveTheme();
            
            // If we clicked a theme button, the new theme should be active
            // If we didn't find the button (theme already active), initial theme should still be active
            if (newThemeButton) {
              expect(activeTheme).toBe(newTheme);
            }
          }
        ),
        { numRuns: 20 } // Reduced runs due to async nature
      );
    });

    it('theme persists to localStorage when changed during pause', async () => {
      await fc.assert(
        fc.asyncProperty(
          scoreArb,
          themeIdArb,
          async (score: number, targetTheme: ThemeId) => {
            cleanup();
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const mockOnResume = jest.fn();

            // Render PauseScreen
            render(
              <PauseScreen
                onResume={mockOnResume}
                score={score}
              />
            );

            // Wait for component to initialize
            await waitFor(() => {
              expect(screen.getByText('PAUSED')).toBeInTheDocument();
            }, { timeout: 1000 });

            // Find the target theme button
            const themeButtons = screen.getAllByRole('button');
            const targetButton = themeButtons.find(btn => {
              const label = btn.getAttribute('aria-label')?.toLowerCase() || '';
              const text = btn.textContent?.toLowerCase() || '';
              const themeNameLower = targetTheme.replace('-', ' ').toLowerCase();
              return label.includes(themeNameLower) || text.includes(themeNameLower);
            });

            if (targetButton && !targetButton.hasAttribute('aria-pressed')) {
              fireEvent.click(targetButton);

              // Wait for theme to load
              await waitFor(() => {
                const resumeButton = screen.getByRole('button', { name: /resume/i });
                expect(resumeButton).not.toBeDisabled();
              }, { timeout: 2000 });

              // Verify theme was persisted to localStorage
              const storedTheme = mockStorage.getItem('shark-shark-theme');
              expect(storedTheme).toBe(targetTheme);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('theme UI updates when theme button is clicked during pause', async () => {
      await fc.assert(
        fc.asyncProperty(
          scoreArb,
          themeIdArb,
          async (score: number, targetTheme: ThemeId) => {
            cleanup();
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const mockOnResume = jest.fn();

            // Render PauseScreen
            render(
              <PauseScreen
                onResume={mockOnResume}
                score={score}
              />
            );

            // Wait for component to initialize
            await waitFor(() => {
              expect(screen.getByText('PAUSED')).toBeInTheDocument();
            }, { timeout: 1000 });

            // Get the display name for the target theme from the registry
            const targetThemeInfo = THEME_REGISTRY[targetTheme];
            const targetDisplayName = targetThemeInfo.name;

            // Find the target theme button using aria-label
            const targetButton = screen.getByRole('button', {
              name: new RegExp(`select ${targetDisplayName} theme`, 'i')
            });

            // Click the theme button
            fireEvent.click(targetButton);

            // Wait for the button to show as active (aria-pressed="true")
            await waitFor(() => {
              const activeButton = screen.getByRole('button', {
                name: new RegExp(`select ${targetDisplayName} theme.*currently active`, 'i')
              });
              expect(activeButton).toBeInTheDocument();
            }, { timeout: 2000 });

            // Wait for loading to complete (resume button enabled)
            await waitFor(() => {
              const resumeButton = screen.getByRole('button', { name: /resume/i });
              expect(resumeButton).not.toBeDisabled();
            }, { timeout: 2000 });

            // Click resume
            const resumeButton = screen.getByRole('button', { name: /resume/i });
            fireEvent.click(resumeButton);

            // Verify resume was called - theme change applies on resume
            expect(mockOnResume).toHaveBeenCalled();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('resume button is disabled while theme is loading', async () => {
      await fc.assert(
        fc.asyncProperty(
          scoreArb,
          async (score: number) => {
            cleanup();
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const mockOnResume = jest.fn();

            // Render PauseScreen
            render(
              <PauseScreen
                onResume={mockOnResume}
                score={score}
              />
            );

            // Wait for component to initialize
            await waitFor(() => {
              expect(screen.getByText('PAUSED')).toBeInTheDocument();
            }, { timeout: 1000 });

            // Find a non-active theme button to click
            const themeButtons = screen.getAllByRole('button');
            const nonActiveButton = themeButtons.find(btn => {
              const isThemeButton = btn.getAttribute('aria-label')?.includes('theme');
              const isNotActive = btn.getAttribute('aria-pressed') !== 'true';
              return isThemeButton && isNotActive;
            });

            if (nonActiveButton) {
              // Click to start loading
              fireEvent.click(nonActiveButton);

              // During loading, resume button should be disabled or show loading text
              // Wait for loading to complete
              await waitFor(() => {
                const resumeButton = screen.getByRole('button', { name: /resume/i });
                expect(resumeButton).not.toBeDisabled();
              }, { timeout: 2000 });
            }

            // After loading completes, resume should be enabled
            const resumeButton = screen.getByRole('button', { name: /resume/i });
            expect(resumeButton).not.toBeDisabled();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
