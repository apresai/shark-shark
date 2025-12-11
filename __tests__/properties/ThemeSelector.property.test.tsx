/**
 * Property-based tests for ThemeSelector component
 * 
 * Tests theme list completeness and active theme indication
 */

import * as fc from 'fast-check';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { ThemeSelector } from '../../src/components/ThemeSelector';
import { THEME_REGISTRY, getAvailableThemeIds } from '../../src/game/themes/themeRegistry';
import type { ThemeId, ThemeInfo } from '../../src/game/types';

// Get all themes as an array
const getAllThemes = (): ThemeInfo[] => Object.values(THEME_REGISTRY);

describe('ThemeSelector Properties', () => {
  // Clean up after each test
  afterEach(() => {
    cleanup();
  });

  /**
   * **Feature: art-themes, Property 3: Theme List Completeness**
   * **Validates: Requirements 3.1, 3.2**
   * 
   * For any call to get available themes, the returned list SHALL contain all 
   * registered themes, and the active theme SHALL be correctly indicated.
   */
  describe('Property 3: Theme List Completeness', () => {
    it('all registered themes appear in the list with their names', () => {
      fc.assert(
        fc.property(
          // Generate any valid theme as the active theme
          fc.constantFrom(...getAvailableThemeIds()),
          (activeTheme: ThemeId) => {
            // Clean up before each property run
            cleanup();
            
            const themes = getAllThemes();
            const mockOnSelect = jest.fn();

            render(
              <ThemeSelector
                themes={themes}
                activeTheme={activeTheme}
                onSelectTheme={mockOnSelect}
              />
            );

            // Verify all theme names are displayed
            for (const theme of themes) {
              const themeButtons = screen.getAllByRole('button', {
                name: new RegExp(`Select ${theme.name} theme`),
              });
              // Should find exactly one button for each theme
              expect(themeButtons.length).toBe(1);
              expect(themeButtons[0]).toHaveTextContent(theme.name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('active theme is correctly indicated with aria-pressed and checkmark', () => {
      fc.assert(
        fc.property(
          // Generate any valid theme as the active theme
          fc.constantFrom(...getAvailableThemeIds()),
          (activeTheme: ThemeId) => {
            // Clean up before each property run
            cleanup();
            
            const themes = getAllThemes();
            const mockOnSelect = jest.fn();

            render(
              <ThemeSelector
                themes={themes}
                activeTheme={activeTheme}
                onSelectTheme={mockOnSelect}
              />
            );

            // Find the active theme button
            const activeThemeInfo = THEME_REGISTRY[activeTheme];
            const activeButtons = screen.getAllByRole('button', {
              name: new RegExp(`Select ${activeThemeInfo.name} theme.*currently active`),
            });

            // Should find exactly one active button
            expect(activeButtons.length).toBe(1);
            const activeButton = activeButtons[0];

            // Verify active theme has aria-pressed="true"
            expect(activeButton).toHaveAttribute('aria-pressed', 'true');

            // Verify active theme has checkmark indicator
            expect(activeButton).toHaveTextContent('✓');

            // Verify non-active themes don't have aria-pressed="true"
            for (const theme of themes) {
              if (theme.id !== activeTheme) {
                const inactiveButtons = screen.getAllByRole('button', {
                  name: new RegExp(`Select ${theme.name} theme(?!.*currently active)`),
                });
                expect(inactiveButtons.length).toBe(1);
                expect(inactiveButtons[0]).toHaveAttribute('aria-pressed', 'false');
                expect(inactiveButtons[0]).not.toHaveTextContent('✓');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('theme count matches registry count', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getAvailableThemeIds()),
          (activeTheme: ThemeId) => {
            // Clean up before each property run
            cleanup();
            
            const themes = getAllThemes();
            const mockOnSelect = jest.fn();

            render(
              <ThemeSelector
                themes={themes}
                activeTheme={activeTheme}
                onSelectTheme={mockOnSelect}
              />
            );

            // Count all theme buttons
            const themeButtons = screen.getAllByRole('button');
            
            // Should have exactly as many buttons as themes in registry
            expect(themeButtons.length).toBe(Object.keys(THEME_REGISTRY).length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('exactly one theme is marked as active at any time', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getAvailableThemeIds()),
          (activeTheme: ThemeId) => {
            // Clean up before each property run
            cleanup();
            
            const themes = getAllThemes();
            const mockOnSelect = jest.fn();

            render(
              <ThemeSelector
                themes={themes}
                activeTheme={activeTheme}
                onSelectTheme={mockOnSelect}
              />
            );

            // Count buttons with aria-pressed="true"
            const allButtons = screen.getAllByRole('button');
            const activeButtons = allButtons.filter(
              button => button.getAttribute('aria-pressed') === 'true'
            );

            // Exactly one button should be marked as active
            expect(activeButtons.length).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
