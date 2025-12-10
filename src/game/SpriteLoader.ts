/**
 * SpriteLoader - Handles loading and caching of SVG sprite assets
 *
 * Loads SVG files as HTMLImageElements for use with canvas drawImage().
 * Provides a singleton instance for global sprite access.
 */

export type PlayerTier = 1 | 2 | 3 | 4 | 5;
export type FishSize = 'tiny' | 'small' | 'medium' | 'large' | 'giant';
export type HazardType = 'shark' | 'crab' | 'jellyfish';
export type UIType = 'life-icon' | 'bubble';

interface SpriteCache {
  player: Map<PlayerTier, HTMLImageElement>;
  fish: Map<FishSize, HTMLImageElement>;
  hazards: Map<HazardType, HTMLImageElement>;
  bonus: {
    seahorse: HTMLImageElement | null;
  };
  ui: Map<UIType, HTMLImageElement>;
}

class SpriteLoader {
  private static instance: SpriteLoader;
  private cache: SpriteCache;
  private loadPromise: Promise<void> | null = null;
  private loaded: boolean = false;

  private constructor() {
    this.cache = {
      player: new Map(),
      fish: new Map(),
      hazards: new Map(),
      bonus: { seahorse: null },
      ui: new Map(),
    };
  }

  static getInstance(): SpriteLoader {
    if (!SpriteLoader.instance) {
      SpriteLoader.instance = new SpriteLoader();
    }
    return SpriteLoader.instance;
  }

  /**
   * Check if all sprites are loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Load all game sprites
   * Returns a promise that resolves when all sprites are loaded
   */
  async loadAll(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.doLoadAll();
    return this.loadPromise;
  }

  private async doLoadAll(): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    // Load player sprites (tiers 1-5)
    for (let tier = 1; tier <= 5; tier++) {
      loadPromises.push(
        this.loadImage(`/assets/player/player-tier${tier}.svg`).then((img) => {
          this.cache.player.set(tier as PlayerTier, img);
        })
      );
    }

    // Load fish sprites
    const fishSizes: FishSize[] = ['tiny', 'small', 'medium', 'large', 'giant'];
    for (const size of fishSizes) {
      loadPromises.push(
        this.loadImage(`/assets/fish/fish-${size}.svg`).then((img) => {
          this.cache.fish.set(size, img);
        })
      );
    }

    // Load hazard sprites
    const hazards: HazardType[] = ['shark', 'crab', 'jellyfish'];
    for (const hazard of hazards) {
      loadPromises.push(
        this.loadImage(`/assets/hazards/${hazard}.svg`).then((img) => {
          this.cache.hazards.set(hazard, img);
        })
      );
    }

    // Load bonus sprite (seahorse)
    loadPromises.push(
      this.loadImage('/assets/bonus/seahorse.svg').then((img) => {
        this.cache.bonus.seahorse = img;
      })
    );

    // Load UI sprites
    const uiTypes: UIType[] = ['life-icon', 'bubble'];
    for (const ui of uiTypes) {
      loadPromises.push(
        this.loadImage(`/assets/ui/${ui}.svg`).then((img) => {
          this.cache.ui.set(ui, img);
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
    return new Promise((resolve, reject) => {
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
