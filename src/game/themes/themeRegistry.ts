/**
 * Theme Registry for Shark Shark
 * Defines available themes and their sprite manifests
 */

import { ThemeId, ThemeInfo, ThemeManifest, PlayerTier, FishSize, HazardType, UIType } from '../types';

// =============================================================================
// Theme Registry - Available Themes
// =============================================================================

export const THEME_REGISTRY: Record<ThemeId, ThemeInfo> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'The original Shark Shark art style',
    previewImage: '/assets/themes/classic/preview.png'
  },
  neon: {
    id: 'neon',
    name: 'Neon Glow',
    description: 'Vibrant neon colors with glow effects',
    previewImage: '/assets/themes/neon/preview.png'
  },
  pixel: {
    id: 'pixel',
    name: 'Pixel Art',
    description: 'Retro 8-bit pixel art style',
    previewImage: '/assets/themes/pixel/preview.png'
  },
  'deep-sea': {
    id: 'deep-sea',
    name: 'Deep Sea',
    description: 'Dark, mysterious deep ocean creatures',
    previewImage: '/assets/themes/deep-sea/preview.png'
  }
};

// =============================================================================
// Sprite Path Templates
// =============================================================================

const PLAYER_SPRITES: Record<PlayerTier, string> = {
  1: 'player/player-tier1.svg',
  2: 'player/player-tier2.svg',
  3: 'player/player-tier3.svg',
  4: 'player/player-tier4.svg',
  5: 'player/player-tier5.svg',
};

const FISH_SPRITES: Record<FishSize, string> = {
  tiny: 'fish/fish-tiny.svg',
  small: 'fish/fish-small.svg',
  medium: 'fish/fish-medium.svg',
  large: 'fish/fish-large.svg',
  giant: 'fish/fish-giant.svg',
};

const HAZARD_SPRITES: Record<HazardType, string> = {
  shark: 'hazards/shark.svg',
  crab: 'hazards/crab.svg',
  jellyfish: 'hazards/jellyfish.svg',
};

const UI_SPRITES: Record<UIType, string> = {
  'life-icon': 'ui/life-icon.svg',
  'bubble': 'ui/bubble.svg',
};

const BONUS_SPRITES = {
  seahorse: 'bonus/seahorse.svg',
};

// =============================================================================
// Theme Manifests - Sprite Paths for Each Theme
// =============================================================================

/**
 * Creates a theme manifest with the given base path
 */
function createThemeManifest(id: ThemeId, basePath: string): ThemeManifest {
  return {
    id,
    basePath,
    sprites: {
      player: PLAYER_SPRITES,
      fish: FISH_SPRITES,
      hazards: HAZARD_SPRITES,
      bonus: BONUS_SPRITES,
      ui: UI_SPRITES,
    },
  };
}

export const THEME_MANIFESTS: Record<ThemeId, ThemeManifest> = {
  classic: createThemeManifest('classic', '/assets'),
  neon: createThemeManifest('neon', '/assets/themes/neon'),
  pixel: createThemeManifest('pixel', '/assets/themes/pixel'),
  'deep-sea': createThemeManifest('deep-sea', '/assets/themes/deep-sea'),
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get all available theme IDs
 */
export function getAvailableThemeIds(): ThemeId[] {
  return Object.keys(THEME_REGISTRY) as ThemeId[];
}

/**
 * Get theme info by ID
 */
export function getThemeInfo(themeId: ThemeId): ThemeInfo | undefined {
  return THEME_REGISTRY[themeId];
}

/**
 * Get theme manifest by ID
 */
export function getThemeManifest(themeId: ThemeId): ThemeManifest | undefined {
  return THEME_MANIFESTS[themeId];
}

/**
 * Check if a theme ID is valid
 */
export function isValidThemeId(themeId: string): themeId is ThemeId {
  return Object.prototype.hasOwnProperty.call(THEME_REGISTRY, themeId);
}

/**
 * Required sprite categories that every theme manifest must have
 */
export const REQUIRED_SPRITE_CATEGORIES = ['player', 'fish', 'hazards', 'bonus', 'ui'] as const;

/**
 * Required player tiers
 */
export const REQUIRED_PLAYER_TIERS: PlayerTier[] = [1, 2, 3, 4, 5];

/**
 * Required fish sizes
 */
export const REQUIRED_FISH_SIZES: FishSize[] = ['tiny', 'small', 'medium', 'large', 'giant'];

/**
 * Required hazard types
 */
export const REQUIRED_HAZARD_TYPES: HazardType[] = ['shark', 'crab', 'jellyfish'];

/**
 * Required UI types
 */
export const REQUIRED_UI_TYPES: UIType[] = ['life-icon', 'bubble'];

/**
 * Validates that a theme manifest has all required sprite categories and entries
 */
export function validateThemeManifest(manifest: ThemeManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check player sprites
  for (const tier of REQUIRED_PLAYER_TIERS) {
    if (!manifest.sprites.player[tier]) {
      errors.push(`Missing player sprite for tier ${tier}`);
    }
  }

  // Check fish sprites
  for (const size of REQUIRED_FISH_SIZES) {
    if (!manifest.sprites.fish[size]) {
      errors.push(`Missing fish sprite for size ${size}`);
    }
  }

  // Check hazard sprites
  for (const type of REQUIRED_HAZARD_TYPES) {
    if (!manifest.sprites.hazards[type]) {
      errors.push(`Missing hazard sprite for type ${type}`);
    }
  }

  // Check bonus sprites
  if (!manifest.sprites.bonus.seahorse) {
    errors.push('Missing bonus sprite for seahorse');
  }

  // Check UI sprites
  for (const type of REQUIRED_UI_TYPES) {
    if (!manifest.sprites.ui[type]) {
      errors.push(`Missing UI sprite for type ${type}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
