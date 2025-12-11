/**
 * Property-based tests for Theme Manifest Validation
 * 
 * **Feature: art-themes, Property 4: Theme Manifest Validation**
 * **Validates: Requirements 4.1, 4.2**
 */

import * as fc from 'fast-check';
import {
  THEME_MANIFESTS,
  THEME_REGISTRY,
  validateThemeManifest,
  getAvailableThemeIds,
  REQUIRED_PLAYER_TIERS,
  REQUIRED_FISH_SIZES,
  REQUIRED_HAZARD_TYPES,
  REQUIRED_UI_TYPES,
} from '../../src/game/themes/themeRegistry';
import { ThemeId, PlayerTier, FishSize, HazardType, UIType } from '../../src/game/types';

describe('Theme Manifest Properties', () => {
  /**
   * **Feature: art-themes, Property 4: Theme Manifest Validation**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * For any theme manifest, the manifest SHALL specify valid paths for all required 
   * sprite categories (player tiers 1-5, fish sizes tiny/small/medium/large/giant, 
   * hazards shark/crab/jellyfish, bonus seahorse, ui life-icon/bubble).
   */
  describe('Property 4: Theme Manifest Validation', () => {
    it('all registered theme manifests specify required sprite categories', () => {
      fc.assert(
        fc.property(
          // Generate a theme ID from the available themes
          fc.constantFrom(...getAvailableThemeIds()),
          (themeId: ThemeId) => {
            const manifest = THEME_MANIFESTS[themeId];
            
            // Manifest must exist
            expect(manifest).toBeDefined();
            
            // Validate the manifest has all required sprites
            const validation = validateThemeManifest(manifest);
            
            // Should be valid with no errors
            expect(validation.valid).toBe(true);
            expect(validation.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all theme manifests have player sprites for all 5 tiers', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getAvailableThemeIds()),
          fc.constantFrom(...REQUIRED_PLAYER_TIERS),
          (themeId: ThemeId, tier: PlayerTier) => {
            const manifest = THEME_MANIFESTS[themeId];
            
            // Player sprite for this tier must exist and be a non-empty string
            const spritePath = manifest.sprites.player[tier];
            expect(typeof spritePath).toBe('string');
            expect(spritePath.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all theme manifests have fish sprites for all sizes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getAvailableThemeIds()),
          fc.constantFrom(...REQUIRED_FISH_SIZES),
          (themeId: ThemeId, size: FishSize) => {
            const manifest = THEME_MANIFESTS[themeId];
            
            // Fish sprite for this size must exist and be a non-empty string
            const spritePath = manifest.sprites.fish[size];
            expect(typeof spritePath).toBe('string');
            expect(spritePath.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all theme manifests have hazard sprites for all types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getAvailableThemeIds()),
          fc.constantFrom(...REQUIRED_HAZARD_TYPES),
          (themeId: ThemeId, hazardType: HazardType) => {
            const manifest = THEME_MANIFESTS[themeId];
            
            // Hazard sprite for this type must exist and be a non-empty string
            const spritePath = manifest.sprites.hazards[hazardType];
            expect(typeof spritePath).toBe('string');
            expect(spritePath.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all theme manifests have UI sprites for all types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getAvailableThemeIds()),
          fc.constantFrom(...REQUIRED_UI_TYPES),
          (themeId: ThemeId, uiType: UIType) => {
            const manifest = THEME_MANIFESTS[themeId];
            
            // UI sprite for this type must exist and be a non-empty string
            const spritePath = manifest.sprites.ui[uiType];
            expect(typeof spritePath).toBe('string');
            expect(spritePath.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('all theme manifests have bonus seahorse sprite', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getAvailableThemeIds()),
          (themeId: ThemeId) => {
            const manifest = THEME_MANIFESTS[themeId];
            
            // Seahorse sprite must exist and be a non-empty string
            const spritePath = manifest.sprites.bonus.seahorse;
            expect(typeof spritePath).toBe('string');
            expect(spritePath.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('every registered theme has a corresponding manifest', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(THEME_REGISTRY) as ThemeId[]),
          (themeId: ThemeId) => {
            // Every theme in the registry must have a manifest
            expect(THEME_MANIFESTS[themeId]).toBeDefined();
            expect(THEME_MANIFESTS[themeId].id).toBe(themeId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('classic theme uses /assets basePath, others use /assets/themes/{id}', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...getAvailableThemeIds()),
          (themeId: ThemeId) => {
            const manifest = THEME_MANIFESTS[themeId];
            
            if (themeId === 'classic') {
              expect(manifest.basePath).toBe('/assets');
            } else {
              expect(manifest.basePath).toBe(`/assets/themes/${themeId}`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
