/**
 * Property-based tests for GameOverScreen responsive styles
 */

import * as fc from 'fast-check';
import { getResponsiveStyles } from '../../src/components/GameOverScreen';
import type { WindowSize } from '../../src/hooks/useWindowSize';

const MOBILE_BREAKPOINT = 768;

// Helper to parse font size from CSS value (e.g., '32px' -> 32)
function parseFontSize(fontSize: string | number | undefined): number {
  if (typeof fontSize === 'number') return fontSize;
  if (typeof fontSize === 'string') {
    const match = fontSize.match(/^(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
  return 0;
}

// Helper to parse padding values (e.g., '20px' -> 20, '16px 40px' -> { vertical: 16, horizontal: 40 })
function parsePadding(padding: string | number | undefined): { vertical: number; horizontal: number } {
  if (typeof padding === 'number') return { vertical: padding, horizontal: padding };
  if (typeof padding === 'string') {
    const parts = padding.split(' ').map(p => parseFloat(p));
    if (parts.length === 1) {
      return { vertical: parts[0], horizontal: parts[0] };
    }
    if (parts.length === 2) {
      return { vertical: parts[0], horizontal: parts[1] };
    }
    if (parts.length === 4) {
      return { vertical: parts[0], horizontal: parts[1] };
    }
  }
  return { vertical: 0, horizontal: 0 };
}

// Helper to parse gap value
function parseGap(gap: string | number | undefined): number {
  if (typeof gap === 'number') return gap;
  if (typeof gap === 'string') {
    const match = gap.match(/^(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
  return 0;
}

// Helper to parse minWidth/minHeight values (e.g., '44px' -> 44)
function parseMinDimension(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/^(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
  return 0;
}

describe('GameOverScreen Responsive Styles Properties', () => {
  /**
   * **Feature: game-over-responsive, Property 1: Mobile font sizes are within specified maximums**
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
   * 
   * For any viewport width <= 768px, the responsive style calculator SHALL return font sizes where:
   * title <= 32px, finalScoreValue <= 28px, statLabel <= 12px, and statValue <= 20px.
   */
  it('Property 1: Mobile font sizes are within specified maximums', () => {
    fc.assert(
      fc.property(
        // Generate mobile viewport widths (1 to 768)
        fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
        // Generate any height
        fc.integer({ min: 1, max: 2000 }),
        (width, height) => {
          const windowSize: WindowSize = {
            width,
            height,
            isMobile: width <= MOBILE_BREAKPOINT,
          };

          const styles = getResponsiveStyles(windowSize);

          // Verify all font sizes are within mobile maximums
          const titleFontSize = parseFontSize(styles.title.fontSize);
          const finalScoreFontSize = parseFontSize(styles.finalScoreValue.fontSize);
          const statLabelFontSize = parseFontSize(styles.statLabel.fontSize);
          const statValueFontSize = parseFontSize(styles.statValue.fontSize);

          expect(titleFontSize).toBeLessThanOrEqual(32);
          expect(finalScoreFontSize).toBeLessThanOrEqual(28);
          expect(statLabelFontSize).toBeLessThanOrEqual(12);
          expect(statValueFontSize).toBeLessThanOrEqual(20);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: game-over-responsive, Property 2: Mobile touch target meets accessibility minimum**
   * **Validates: Requirements 2.6**
   * 
   * For any viewport width <= 768px, the restart button dimensions (padding + content) 
   * SHALL be >= 44px in both width and height.
   */
  it('Property 2: Mobile touch target meets accessibility minimum', () => {
    fc.assert(
      fc.property(
        // Generate mobile viewport widths (1 to 768)
        fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
        // Generate any height
        fc.integer({ min: 1, max: 2000 }),
        (width, height) => {
          const windowSize: WindowSize = {
            width,
            height,
            isMobile: width <= MOBILE_BREAKPOINT,
          };

          const styles = getResponsiveStyles(windowSize);

          // Verify button has minimum touch target dimensions
          const buttonPadding = parsePadding(styles.restartButton.padding);
          const minWidth = parseMinDimension(styles.restartButton.minWidth);
          const minHeight = parseMinDimension(styles.restartButton.minHeight);

          // Button must have either explicit minWidth/minHeight >= 44px
          // OR padding that ensures touch target >= 44px
          // With padding '16px 40px', vertical padding is 32px total
          // With any text content, this exceeds 44px
          // We verify the explicit minWidth and minHeight are set to at least 44px
          expect(minWidth).toBeGreaterThanOrEqual(44);
          expect(minHeight).toBeGreaterThanOrEqual(44);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: game-over-responsive, Property 3: Mobile spacing is reduced proportionally**
   * **Validates: Requirements 4.1, 4.3**
   * 
   * For any viewport width <= 768px, the responsive style calculator SHALL return:
   * container padding of 20px, element gap of 16px, and stats gap of 30px.
   */
  it('Property 3: Mobile spacing is reduced proportionally', () => {
    fc.assert(
      fc.property(
        // Generate mobile viewport widths (1 to 768)
        fc.integer({ min: 1, max: MOBILE_BREAKPOINT }),
        // Generate any height
        fc.integer({ min: 1, max: 2000 }),
        (width, height) => {
          const windowSize: WindowSize = {
            width,
            height,
            isMobile: width <= MOBILE_BREAKPOINT,
          };

          const styles = getResponsiveStyles(windowSize);

          // Verify container padding is 20px
          const containerPadding = parsePadding(styles.container.padding);
          expect(containerPadding.vertical).toBe(20);
          expect(containerPadding.horizontal).toBe(20);

          // Verify element gap is 16px
          const containerGap = parseGap(styles.container.gap);
          expect(containerGap).toBe(16);

          // Verify stats gap is 30px
          const statsGap = parseGap(styles.statsSection.gap);
          expect(statsGap).toBe(30);
        }
      ),
      { numRuns: 100 }
    );
  });
});
