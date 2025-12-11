/**
 * SpriteLoader - Handles loading and caching of SVG sprite assets
 *
 * Loads SVG files as HTMLImageElements for use with canvas drawImage().
 * Provides a singleton instance for global sprite access.
 * Supports theme-aware loading with fallback to classic theme.
 */

import { ThemeId, PlayerTier, FishSize, HazardType, UIType, ThemeManifest } from './types';
import { THEME_MANIFESTS, getThemeManifest } from './themes/themeRegistry';
import { themeManager } from './ThemeManager';

// Re-export types for backward compatibility
export type { PlayerTier, FishSize, HazardType, UIType };

interface SpriteCache {
  player: Map<PlayerTier, HTMLImageElement>;
  fish: Map<FishSize, HTMLImageElement>;
  hazards: Map<HazardType, HTMLImageElement>;
  bonus: {
    seahorse: HTMLImageElement | null;
  };
  ui: Map<UIType, HTMLImageElement>;
}

// Track which sprites are from fallback (classic theme)
interface FallbackTracker {
  player: Set<PlayerTier>;
  fish: Set<FishSize>;
  hazards: Set<HazardType>;
  bonus: Set<string>;
  ui: Set<UIType>;
}

class SpriteLoader {
  private static instance: SpriteLoader;
  private cache: SpriteCache;
  private loadPromise: Promise<void> | null = null;
  private loaded: boolean = false;
  private currentTheme: ThemeId = 'classic';
  private fallbackSprites: FallbackTracker;

  private constructor() {
    this.cache = {
      player: new Map(),
      fish: new Map(),
      hazards: new Map(),
      bonus: { seahorse: null },
      ui: new Map(),
    };
    this.fallbackSprites = {
      player: new Set(),
      fish: new Set(),
      hazards: new Set(),
      bonus: new Set(),
      ui: new Set(),
    };
  }

  static getInstance(): SpriteLoader {
    if (!SpriteLoader.instance) {
      SpriteLoader.instance = new SpriteLoader();
    }
    return SpriteLoader.instance;
  }

  /**
   * Reset the singleton instance (for testing purposes)
   */
  static resetInstance(): void {
    SpriteLoader.instance = undefined as unknown as SpriteLoader;
  }

  /**
   * Check if all sprites are loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get the currently loaded theme
   */
  getCurrentTheme(): ThemeId {
    return this.currentTheme;
  }

  /**
   * Get theme manifest by ID
   */
  getThemeManifest(themeId: ThemeId): ThemeManifest | null {
    return getThemeManifest(themeId) || null;
  }

  /**
   * Load all game sprites for the active theme from ThemeManager
   * Returns a promise that resolves when all sprites are loaded
   */
  async loadAll(): Promise<void> {
    const activeTheme = themeManager.getActiveTheme();
    return this.loadTheme(activeTheme);
  }

  /**
   * Load all sprites for a specific theme
   * Falls back to classic theme sprites if theme sprites fail to load
   */
  async loadTheme(themeId: ThemeId): Promise<void> {
    // Reset state for new theme load
    this.loaded = false;
    this.loadPromise = null;
    this.clearFallbackTracking();
    
    this.loadPromise = this.doLoadTheme(themeId);
    return this.loadPromise;
  }

  private clearFallbackTracking(): void {
    this.fallbackSprites = {
      player: new Set(),
      fish: new Set(),
      hazards: new Set(),
      bonus: new Set(),
      ui: new Set(),
    };
  }

  private async doLoadTheme(themeId: ThemeId): Promise<void> {
    const manifest = getThemeManifest(themeId);
    const classicManifest = THEME_MANIFESTS['classic'];
    
    if (!manifest) {
      console.warn(`Theme manifest not found for ${themeId}, falling back to classic`);
      return this.doLoadTheme('classic');
    }

    this.currentTheme = themeId;
    const loadPromises: Promise<void>[] = [];

    // Load player sprites (tiers 1-5)
    const playerTiers: PlayerTier[] = [1, 2, 3, 4, 5];
    for (const tier of playerTiers) {
      const spritePath = manifest.sprites.player[tier];
      const fullPath = `${manifest.basePath}/${spritePath}`;
      const classicPath = `${classicManifest.basePath}/${classicManifest.sprites.player[tier]}`;
      
      loadPromises.push(
        this.loadImageWithFallback(fullPath, classicPath, themeId !== 'classic').then((result) => {
          this.cache.player.set(tier, result.image);
          if (result.usedFallback) {
            this.fallbackSprites.player.add(tier);
          }
        })
      );
    }

    // Load fish sprites
    const fishSizes: FishSize[] = ['tiny', 'small', 'medium', 'large', 'giant'];
    for (const size of fishSizes) {
      const spritePath = manifest.sprites.fish[size];
      const fullPath = `${manifest.basePath}/${spritePath}`;
      const classicPath = `${classicManifest.basePath}/${classicManifest.sprites.fish[size]}`;
      
      loadPromises.push(
        this.loadImageWithFallback(fullPath, classicPath, themeId !== 'classic').then((result) => {
          this.cache.fish.set(size, result.image);
          if (result.usedFallback) {
            this.fallbackSprites.fish.add(size);
          }
        })
      );
    }

    // Load hazard sprites
    const hazards: HazardType[] = ['shark', 'crab', 'jellyfish'];
    for (const hazard of hazards) {
      const spritePath = manifest.sprites.hazards[hazard];
      const fullPath = `${manifest.basePath}/${spritePath}`;
      const classicPath = `${classicManifest.basePath}/${classicManifest.sprites.hazards[hazard]}`;
      
      loadPromises.push(
        this.loadImageWithFallback(fullPath, classicPath, themeId !== 'classic').then((result) => {
          this.cache.hazards.set(hazard, result.image);
          if (result.usedFallback) {
            this.fallbackSprites.hazards.add(hazard);
          }
        })
      );
    }

    // Load bonus sprite (seahorse)
    const seahorsePath = manifest.sprites.bonus.seahorse;
    const fullSeahorsePath = `${manifest.basePath}/${seahorsePath}`;
    const classicSeahorsePath = `${classicManifest.basePath}/${classicManifest.sprites.bonus.seahorse}`;
    
    loadPromises.push(
      this.loadImageWithFallback(fullSeahorsePath, classicSeahorsePath, themeId !== 'classic').then((result) => {
        this.cache.bonus.seahorse = result.image;
        if (result.usedFallback) {
          this.fallbackSprites.bonus.add('seahorse');
        }
      })
    );

    // Load UI sprites
    const uiTypes: UIType[] = ['life-icon', 'bubble'];
    for (const ui of uiTypes) {
      const spritePath = manifest.sprites.ui[ui];
      const fullPath = `${manifest.basePath}/${spritePath}`;
      const classicPath = `${classicManifest.basePath}/${classicManifest.sprites.ui[ui]}`;
      
      loadPromises.push(
        this.loadImageWithFallback(fullPath, classicPath, themeId !== 'classic').then((result) => {
          this.cache.ui.set(ui, result.image);
          if (result.usedFallback) {
            this.fallbackSprites.ui.add(ui);
          }
        })
      );
    }

    await Promise.all(loadPromises);
    this.loaded = true;
  }

  /**
   * Load a single image from a URL
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.warn(`Failed to load sprite: ${src}`, e);
        // Create a fallback 1x1 transparent image
        const fallback = new Image();
        fallback.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        resolve(fallback);
      };
      img.src = src;
    });
  }

  /**
   * Load an image with fallback to classic theme sprite
   * Returns the loaded image and whether fallback was used
   */
  private loadImageWithFallback(
    primarySrc: string,
    fallbackSrc: string,
    enableFallback: boolean
  ): Promise<{ image: HTMLImageElement; usedFallback: boolean }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ image: img, usedFallback: false });
      img.onerror = () => {
        if (enableFallback) {
          console.warn(`Failed to load theme sprite: ${primarySrc}, falling back to classic: ${fallbackSrc}`);
          // Try loading the classic theme sprite
          const fallbackImg = new Image();
          fallbackImg.onload = () => resolve({ image: fallbackImg, usedFallback: true });
          fallbackImg.onerror = () => {
            console.warn(`Failed to load fallback sprite: ${fallbackSrc}`);
            // Create a 1x1 transparent image as last resort
            const transparent = new Image();
            transparent.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            resolve({ image: transparent, usedFallback: true });
          };
          fallbackImg.src = fallbackSrc;
        } else {
          console.warn(`Failed to load sprite: ${primarySrc}`);
          // Create a 1x1 transparent image
          const transparent = new Image();
          transparent.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          resolve({ image: transparent, usedFallback: false });
        }
      };
      img.src = primarySrc;
    });
  }

  /**
   * Check if a sprite is using fallback from classic theme
   */
  isUsingFallback(category: 'player' | 'fish' | 'hazards' | 'bonus' | 'ui', key: string | number): boolean {
    switch (category) {
      case 'player':
        return this.fallbackSprites.player.has(key as PlayerTier);
      case 'fish':
        return this.fallbackSprites.fish.has(key as FishSize);
      case 'hazards':
        return this.fallbackSprites.hazards.has(key as HazardType);
      case 'bonus':
        return this.fallbackSprites.bonus.has(key as string);
      case 'ui':
        return this.fallbackSprites.ui.has(key as UIType);
      default:
        return false;
    }
  }

  /**
   * Get the sprite path for a given category and key based on current theme
   */
  getSpritePath(category: 'player' | 'fish' | 'hazards' | 'bonus' | 'ui', key: string | number): string | null {
    const manifest = getThemeManifest(this.currentTheme);
    if (!manifest) return null;

    let spritePath: string | undefined;
    switch (category) {
      case 'player':
        spritePath = manifest.sprites.player[key as PlayerTier];
        break;
      case 'fish':
        spritePath = manifest.sprites.fish[key as FishSize];
        break;
      case 'hazards':
        spritePath = manifest.sprites.hazards[key as HazardType];
        break;
      case 'bonus':
        spritePath = manifest.sprites.bonus[key as keyof typeof manifest.sprites.bonus];
        break;
      case 'ui':
        spritePath = manifest.sprites.ui[key as UIType];
        break;
    }

    if (!spritePath) return null;
    
    // If using fallback, return classic path
    if (this.isUsingFallback(category, key)) {
      const classicManifest = THEME_MANIFESTS['classic'];
      let classicPath: string | undefined;
      switch (category) {
        case 'player':
          classicPath = classicManifest.sprites.player[key as PlayerTier];
          break;
        case 'fish':
          classicPath = classicManifest.sprites.fish[key as FishSize];
          break;
        case 'hazards':
          classicPath = classicManifest.sprites.hazards[key as HazardType];
          break;
        case 'bonus':
          classicPath = classicManifest.sprites.bonus[key as keyof typeof classicManifest.sprites.bonus];
          break;
        case 'ui':
          classicPath = classicManifest.sprites.ui[key as UIType];
          break;
      }
      return classicPath ? `${classicManifest.basePath}/${classicPath}` : null;
    }

    return `${manifest.basePath}/${spritePath}`;
  }

  /**
   * Get player sprite for a specific tier
   */
  getPlayerSprite(tier: PlayerTier): HTMLImageElement | null {
    return this.cache.player.get(tier) || null;
  }

  /**
   * Get fish sprite for a specific size
   */
  getFishSprite(size: FishSize): HTMLImageElement | null {
    return this.cache.fish.get(size) || null;
  }

  /**
   * Get hazard sprite
   */
  getHazardSprite(type: HazardType): HTMLImageElement | null {
    return this.cache.hazards.get(type) || null;
  }

  /**
   * Get seahorse sprite
   */
  getSeahorseSprite(): HTMLImageElement | null {
    return this.cache.bonus.seahorse;
  }

  /**
   * Get UI sprite
   */
  getUISprite(type: UIType): HTMLImageElement | null {
    return this.cache.ui.get(type) || null;
  }
}

// Export singleton instance
export const spriteLoader = SpriteLoader.getInstance();
export default SpriteLoader;
