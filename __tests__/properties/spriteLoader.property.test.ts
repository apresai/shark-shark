/**
 * Property-based tests for SpriteLoader
 * 
 * Tests theme-sprite consistency - verifies that sprite paths match the active theme
 * 
 * **Feature: art-themes, Property 1: Theme-Sprite Consistency**
 * **Validates: Requirements 1.2, 1.4**
 */

import * as fc from 'fast-check';
import SpriteLoader from '../../src/game/SpriteLoader';
import ThemeManager from '../../src/game/ThemeManager';
import { getAvailableThemeIds, THEME_MANIFESTS } from '../../src/game/themes/themeRegistry';
import { ThemeId, PlayerTier, FishSize, HazardType, UIType } from '../../src/game/types';

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

// Mock Image for testing (since we're in Node.js environment)
class MockImage {
  src: string = '';
  onload: (() => void) | null = null;
  onerror: ((e: Error) => void) | null = null;

  constructor() {
    // Simulate async image loading
    setTimeout(() => {
      // For classic theme, images should load successfully
      // For other themes, simulate failure to test fallback
      if (this.src.includes('/assets/themes/')) {
        // Non-classic theme - simulate failure to trigger fallback
        if (this.onerror) {
          this.onerror(new Error('Image not found'));
        }
      } else if (this.src.startsWith('/assets/')) {
        // Classic theme - simulate success
        if (this.onload) {
          this.onload();
        }
      } else if (this.src.startsWith('data:')) {
        // Fallback transparent image
        if (this.onload) {
          this.onload();
        }
      } else {
        if (this.onerror) {
          this.onerror(new Error('Image not found'));
        }
      }
    }, 0);
  }
}

describe('SpriteLoader Properties', () => {
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
    // Restore originals
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
    (global as unknown as { Image: typeof Image }).Image = originalImage;
  });

  // Arbitraries for sprite categories
  const playerTierArb = fc.constantFrom<PlayerTier>(1, 2, 3, 4, 5);
  const fishSizeArb = fc.constantFrom<FishSize>('tiny', 'small', 'medium', 'large', 'giant');
  const hazardTypeArb = fc.constantFrom<HazardType>('shark', 'crab', 'jellyfish');
  const uiTypeArb = fc.constantFrom<UIType>('life-icon', 'bubble');
  const themeIdArb = fc.constantFrom(...getAvailableThemeIds());

  /**
   * **Feature: art-themes, Property 1: Theme-Sprite Consistency**
   * **Validates: Requirements 1.2, 1.4**
   * 
   * For any active theme and any sprite request, the returned sprite path
   * SHALL originate from the active theme's asset directory (or classic fallback).
   */
  describe('Property 1: Theme-Sprite Consistency', () => {
    it('player sprite paths match the active theme basePath', async () => {
      await fc.assert(
        fc.asyncProperty(
          themeIdArb,
          playerTierArb,
          async (themeId: ThemeId, tier: PlayerTier) => {
            // Reset for each test
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const spriteLoader = SpriteLoader.getInstance();
            await spriteLoader.loadTheme(themeId);

            const currentTheme = spriteLoader.getCurrentTheme();
            expect(currentTheme).toBe(themeId);

            const spritePath = spriteLoader.getSpritePath('player', tier);
            expect(spritePath).not.toBeNull();

            // Path should start with the theme's basePath or classic basePath (if fallback)
            const manifest = THEME_MANIFESTS[themeId];
            const classicManifest = THEME_MANIFESTS['classic'];
            
            const isFromTheme = spritePath!.startsWith(manifest.basePath);
            const isFromClassicFallback = spritePath!.startsWith(classicManifest.basePath);
            
            // Sprite path must come from either the active theme or classic fallback
            expect(isFromTheme || isFromClassicFallback).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('fish sprite paths match the active theme basePath', async () => {
      await fc.assert(
        fc.asyncProperty(
          themeIdArb,
          fishSizeArb,
          async (themeId: ThemeId, size: FishSize) => {
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const spriteLoader = SpriteLoader.getInstance();
            await spriteLoader.loadTheme(themeId);

            const spritePath = spriteLoader.getSpritePath('fish', size);
            expect(spritePath).not.toBeNull();

            const manifest = THEME_MANIFESTS[themeId];
            const classicManifest = THEME_MANIFESTS['classic'];
            
            const isFromTheme = spritePath!.startsWith(manifest.basePath);
            const isFromClassicFallback = spritePath!.startsWith(classicManifest.basePath);
            
            expect(isFromTheme || isFromClassicFallback).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('hazard sprite paths match the active theme basePath', async () => {
      await fc.assert(
        fc.asyncProperty(
          themeIdArb,
          hazardTypeArb,
          async (themeId: ThemeId, hazardType: HazardType) => {
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const spriteLoader = SpriteLoader.getInstance();
            await spriteLoader.loadTheme(themeId);

            const spritePath = spriteLoader.getSpritePath('hazards', hazardType);
            expect(spritePath).not.toBeNull();

            const manifest = THEME_MANIFESTS[themeId];
            const classicManifest = THEME_MANIFESTS['classic'];
            
            const isFromTheme = spritePath!.startsWith(manifest.basePath);
            const isFromClassicFallback = spritePath!.startsWith(classicManifest.basePath);
            
            expect(isFromTheme || isFromClassicFallback).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('UI sprite paths match the active theme basePath', async () => {
      await fc.assert(
        fc.asyncProperty(
          themeIdArb,
          uiTypeArb,
          async (themeId: ThemeId, uiType: UIType) => {
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const spriteLoader = SpriteLoader.getInstance();
            await spriteLoader.loadTheme(themeId);

            const spritePath = spriteLoader.getSpritePath('ui', uiType);
            expect(spritePath).not.toBeNull();

            const manifest = THEME_MANIFESTS[themeId];
            const classicManifest = THEME_MANIFESTS['classic'];
            
            const isFromTheme = spritePath!.startsWith(manifest.basePath);
            const isFromClassicFallback = spritePath!.startsWith(classicManifest.basePath);
            
            expect(isFromTheme || isFromClassicFallback).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('bonus (seahorse) sprite path matches the active theme basePath', async () => {
      await fc.assert(
        fc.asyncProperty(
          themeIdArb,
          async (themeId: ThemeId) => {
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const spriteLoader = SpriteLoader.getInstance();
            await spriteLoader.loadTheme(themeId);

            const spritePath = spriteLoader.getSpritePath('bonus', 'seahorse');
            expect(spritePath).not.toBeNull();

            const manifest = THEME_MANIFESTS[themeId];
            const classicManifest = THEME_MANIFESTS['classic'];
            
            const isFromTheme = spritePath!.startsWith(manifest.basePath);
            const isFromClassicFallback = spritePath!.startsWith(classicManifest.basePath);
            
            expect(isFromTheme || isFromClassicFallback).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getCurrentTheme returns the theme that was loaded', async () => {
      await fc.assert(
        fc.asyncProperty(
          themeIdArb,
          async (themeId: ThemeId) => {
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const spriteLoader = SpriteLoader.getInstance();
            await spriteLoader.loadTheme(themeId);

            // getCurrentTheme should return the theme we loaded
            expect(spriteLoader.getCurrentTheme()).toBe(themeId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('classic theme sprites never use fallback', async () => {
      await fc.assert(
        fc.asyncProperty(
          playerTierArb,
          fishSizeArb,
          hazardTypeArb,
          uiTypeArb,
          async (tier: PlayerTier, size: FishSize, hazard: HazardType, ui: UIType) => {
            mockStorage.clear();
            SpriteLoader.resetInstance();
            ThemeManager.resetInstance();

            const spriteLoader = SpriteLoader.getInstance();
            await spriteLoader.loadTheme('classic');

            // Classic theme should never use fallback
            expect(spriteLoader.isUsingFallback('player', tier)).toBe(false);
            expect(spriteLoader.isUsingFallback('fish', size)).toBe(false);
            expect(spriteLoader.isUsingFallback('hazards', hazard)).toBe(false);
            expect(spriteLoader.isUsingFallback('ui', ui)).toBe(false);
            expect(spriteLoader.isUsingFallback('bonus', 'seahorse')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
