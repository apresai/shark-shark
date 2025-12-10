/**
 * ============================================================================
 * SHARK SHARK - GAME CONFIGURATION
 * ============================================================================
 * 
 * All game settings are centralized in this file for easy customization.
 * Modify these values to adjust gameplay balance, difficulty, and behavior.
 * 
 * SECTIONS:
 * 1. Display Settings - Canvas size and aspect ratio
 * 2. Player Settings - Size, speed, and tier progression
 * 3. Fish Settings - Enemy fish sizes, speeds, and point values
 * 4. Hazard Settings - Shark, crab, jellyfish configuration
 * 5. Bonus Settings - Seahorse rewards and spawn timing
 * 6. Scoring Settings - Points, extra lives, high scores
 * 7. Difficulty Settings - Spawn rates and progression timing
 * 8. Game Loop Settings - Frame rate and timing
 */

// =============================================================================
// 1. DISPLAY SETTINGS
// =============================================================================

/** Game canvas width in pixels */
export const CANVAS_WIDTH = 800;

/** Game canvas height in pixels */
export const CANVAS_HEIGHT = 600;

/** Calculated aspect ratio (4:3 by default) */
export const CANVAS_ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;

// =============================================================================
// 2. PLAYER SETTINGS
// =============================================================================

/**
 * Player fish dimensions at each tier (in pixels)
 * - Tier 1: Smallest, most vulnerable
 * - Tier 5: Largest, can eat most fish
 */
export const TIER_DIMENSIONS: Record<number, { width: number; height: number }> = {
  1: { width: 16, height: 12 },
  2: { width: 24, height: 18 },
  3: { width: 32, height: 24 },
  4: { width: 48, height: 36 },
  5: { width: 64, height: 48 },
};

/**
 * Number of fish that must be eaten to reach each tier
 * - Tier 1: Start (0 fish)
 * - Tier 2: 5 fish eaten
 * - Tier 3: 15 fish eaten
 * - Tier 4: 30 fish eaten
 * - Tier 5: 50 fish eaten (max tier)
 */
export const TIER_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 5,
  3: 15,
  4: 30,
  5: 50,
};

/** Maximum tier the player can reach */
export const MAX_TIER = 5;

/** Starting tier for new game */
export const INITIAL_TIER = 1;

/** Base movement speed in pixels per second */
export const PLAYER_BASE_SPEED = 200;

/** Additional speed gained per tier (pixels/second) */
export const PLAYER_TIER_SPEED_BONUS = 10;

/** Friction coefficient (0-1, lower = more slippery) */
export const PLAYER_FRICTION = 0.92;

/** Acceleration rate when pressing movement keys */
export const PLAYER_ACCELERATION = 800;

// =============================================================================
// 3. FISH SETTINGS
// =============================================================================

/** Fish size categories */
export type FishSizeKey = 'tiny' | 'small' | 'medium' | 'large' | 'giant';

/**
 * Fish dimensions by size (in pixels)
 * Smaller fish are faster but worth fewer points
 */
export const FISH_DIMENSIONS: Record<FishSizeKey, { width: number; height: number }> = {
  tiny: { width: 12, height: 9 },
  small: { width: 20, height: 15 },
  medium: { width: 28, height: 21 },
  large: { width: 40, height: 30 },
  giant: { width: 56, height: 42 },
};

/**
 * Points awarded for eating each fish size
 * Larger fish = more points but harder to eat
 */
export const FISH_POINTS: Record<FishSizeKey, number> = {
  tiny: 10,
  small: 25,
  medium: 50,
  large: 100,
  giant: 200,
};

/**
 * Base swimming speed for each fish size (pixels/second)
 * Smaller fish swim faster
 */
export const FISH_SPEEDS: Record<FishSizeKey, number> = {
  tiny: 60,
  small: 50,
  medium: 45,
  large: 40,
  giant: 35,
};

/** Minimum Y position for fish spawning (pixels from top) */
export const FISH_SPAWN_Y_MIN = 50;

/** Maximum Y position for fish spawning (leaves room for floor hazards) */
export const FISH_SPAWN_Y_MAX = CANVAS_HEIGHT - 80;

// =============================================================================
// 4. HAZARD SETTINGS
// =============================================================================

/**
 * SHARK - The main predator
 * Patrols the upper screen and dives when player is below
 * Player can bite the tail for bonus points
 */
export const SHARK_CONFIG = {
  /** Shark body width in pixels */
  width: 96,
  /** Shark body height in pixels */
  height: 48,
  /** Normal patrol speed (pixels/second) */
  baseSpeed: 120,
  /** Maximum speed when diving (pixels/second) */
  maxSpeed: 200,
  /** Percentage of body that is bitable tail (0.1 = 10%) */
  tailRatio: 0.1,
  /** Percentage of body that kills player (0.9 = 90%) */
  bodyRatio: 0.9,
  /** Points awarded for biting shark's tail */
  tailPoints: 500,
  /** Seconds player must be below shark to trigger dive */
  diveTriggerTime: 1,
  /** Upper portion of screen where shark patrols (0.6 = top 60%) */
  patrolYRange: 0.6,
  /** Speed when diving toward player (pixels/second) */
  diveSpeed: 180,
  /** Speed when returning to patrol area (pixels/second) */
  returnSpeed: 100,
};

/**
 * CRAB - Floor hazard
 * Walks along the ocean floor, lethal to player
 */
export const CRAB_CONFIG = {
  /** Crab width in pixels */
  width: 24,
  /** Crab height in pixels */
  height: 16,
  /** Walking speed (pixels/second) */
  speed: 40,
  /** Y position (ocean floor) */
  floorY: CANVAS_HEIGHT - 16,
};

/**
 * JELLYFISH - Rising hazard
 * Floats upward from bottom, lethal to player
 */
export const JELLYFISH_CONFIG = {
  /** Jellyfish width in pixels */
  width: 20,
  /** Jellyfish height in pixels */
  height: 28,
  /** Rising speed (pixels/second) */
  speed: 30,
  /** Maximum number on screen at once */
  maxCount: 3,
};

// =============================================================================
// 5. BONUS SETTINGS
// =============================================================================

/**
 * SEAHORSE - Bonus collectible
 * Appears periodically, awards points and chance for extra life
 */
export const SEAHORSE_CONFIG = {
  /** Seahorse width in pixels */
  width: 16,
  /** Seahorse height in pixels */
  height: 24,
  /** Movement speed (pixels/second) */
  speed: 50,
  /** Seconds before seahorse despawns */
  lifetime: 8,
  /** Points awarded for collecting */
  points: 200,
  /** Chance to award extra life (0.25 = 25%) */
  extraLifeChance: 0.25,
  /** Minimum seconds between seahorse spawns */
  spawnIntervalMin: 45,
  /** Maximum seconds between seahorse spawns */
  spawnIntervalMax: 90,
};

// =============================================================================
// 6. SCORING SETTINGS
// =============================================================================

/**
 * Score thresholds that award extra lives
 * Player gets +1 life at each threshold
 */
export const EXTRA_LIFE_THRESHOLDS = [10000, 30000, 60000, 100000];

/** After 100k, award extra life every N points */
export const EXTRA_LIFE_INTERVAL_AFTER_100K = 50000;

/** Maximum entries in high score table */
export const HIGH_SCORE_MAX_ENTRIES = 10;

/** localStorage key for saving high scores */
export const HIGH_SCORE_STORAGE_KEY = 'sharkshark_highscores';

// =============================================================================
// 7. DIFFICULTY SETTINGS
// =============================================================================

/**
 * Difficulty progression configuration
 * Game gets harder over time as these values scale from min to max
 */
export const DIFFICULTY_CONFIG = {
  // --- Fish Spawn Rate ---
  /** Starting fish spawn rate (fish per second) */
  fishSpawnRateMin: 0.8,
  /** Maximum fish spawn rate at peak difficulty */
  fishSpawnRateMax: 2.0,

  // --- Fish Speed ---
  /** Starting fish speed multiplier */
  fishSpeedMultiplierMin: 1.0,
  /** Maximum fish speed multiplier at peak difficulty */
  fishSpeedMultiplierMax: 1.5,

  // --- Fish Size Distribution ---
  /** Starting ratio of large fish (0.2 = 20% large) */
  largeFishRatioMin: 0.2,
  /** Maximum ratio of large fish at peak difficulty */
  largeFishRatioMax: 0.5,

  // --- Difficulty Timing ---
  /** Seconds to reach maximum difficulty */
  maxDifficultyTime: 300, // 5 minutes

  // --- Hazard Activation ---
  /** Seconds until shark appears */
  sharkEnableTime: 80,
  /** Player tier required for crabs to appear */
  crabEnableTier: 2,
  /** Seconds until jellyfish appear */
  jellyfishEnableTime: 60,
};

// =============================================================================
// 8. LIVES & RESPAWN SETTINGS
// =============================================================================

/** Number of lives at game start */
export const INITIAL_LIVES = 3;

/** Seconds of invulnerability after respawning */
export const INVULNERABILITY_DURATION = 2;

// =============================================================================
// 9. GAME LOOP SETTINGS (Advanced)
// =============================================================================

/** Fixed timestep for physics updates (ms) - 60 FPS */
export const FIXED_TIMESTEP = 16.67;

/** Maximum frame time to prevent spiral of death (ms) */
export const MAX_FRAME_TIME = 250;

/** Target frames per second */
export const TARGET_FPS = 60;
