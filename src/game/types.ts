/**
 * Type Definitions for Shark Shark
 * All interfaces, types, and enums for the game
 */

// =============================================================================
// Core Math Types
// =============================================================================

export interface Vector2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// =============================================================================
// Entity Types
// =============================================================================

export type EntityType = 'player' | 'fish' | 'shark' | 'crab' | 'jellyfish' | 'seahorse';

export type FishSize = 'tiny' | 'small' | 'medium' | 'large' | 'giant';

export type SharkState = 'patrol' | 'dive' | 'return';

// =============================================================================
// Entity Interfaces
// =============================================================================

export interface Entity {
  id: string;
  type: EntityType;
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  active: boolean;
  
  update(deltaTime: number, gameState: GameState): void;
  render(ctx: CanvasRenderingContext2D, interpolation: number): void;
  getBoundingBox(): BoundingBox;
}


export interface PlayerState {
  position: Vector2D;
  velocity: Vector2D;
  tier: 1 | 2 | 3 | 4 | 5;
  width: number;
  height: number;
  fishEaten: number;
  facingLeft: boolean;
  invulnerable: boolean;
  invulnerableTimer: number;
}

export interface FishEntity extends Entity {
  type: 'fish';
  size: FishSize;
  points: number;
}

export interface SharkEntity extends Entity {
  type: 'shark';
  state: SharkState;
  diveTimer: number;
  targetY: number;
}

export interface CrabEntity extends Entity {
  type: 'crab';
}

export interface JellyfishEntity extends Entity {
  type: 'jellyfish';
}

export interface SeahorseEntity extends Entity {
  type: 'seahorse';
  lifetime: number;
}

// =============================================================================
// Input Types
// =============================================================================

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pause: boolean;
}

export interface InputVector {
  x: number;  // -1 to 1
  y: number;  // -1 to 1
}

export type InputSource = 'keyboard' | 'touch';

// =============================================================================
// Collision Types
// =============================================================================

export type CollisionResultType = 'eat' | 'death' | 'shark_tail' | 'bonus' | 'hazard';

export interface CollisionResult {
  type: CollisionResultType;
  entityA: Entity;
  entityB: Entity;
  points?: number;
}


// =============================================================================
// Game State Types
// =============================================================================

export type GameStatus = 
  | 'initializing'
  | 'title'
  | 'playing'
  | 'paused'
  | 'dying'
  | 'respawn'
  | 'gameover';

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  lives: number;
  player: PlayerState;
  entities: Entity[];
  difficulty: DifficultyConfig;
  elapsedTime: number;
}

// =============================================================================
// Game Actions (for reducer)
// =============================================================================

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'PLAYER_DEATH' }
  | { type: 'RESPAWN' }
  | { type: 'COMPLETE_RESPAWN' }
  | { type: 'EAT_FISH'; fish: FishEntity; points: number }
  | { type: 'TIER_UP'; newTier: 1 | 2 | 3 | 4 | 5 }
  | { type: 'EXTRA_LIFE' }
  | { type: 'RESTART' }
  | { type: 'UPDATE_PLAYER'; player: Partial<PlayerState> }
  | { type: 'ADD_ENTITY'; entity: Entity }
  | { type: 'REMOVE_ENTITY'; entityId: string }
  | { type: 'UPDATE_DIFFICULTY'; difficulty: Partial<DifficultyConfig> }
  | { type: 'UPDATE_ELAPSED_TIME'; elapsedTime: number }
  | { type: 'ADD_SCORE'; points: number }
  | { type: 'COLLECT_SEAHORSE'; points: number; extraLife: boolean }
  | { type: 'BITE_SHARK_TAIL'; points: number };

// =============================================================================
// Difficulty Configuration
// =============================================================================

export interface DifficultyConfig {
  fishSpawnRate: number;        // 0.8 to 2.0 fish/second
  fishSpeedMultiplier: number;  // 1.0 to 1.5
  sharkEnabled: boolean;        // After 20 seconds
  sharkSpeed: number;           // 120 to 200 px/s
  crabEnabled: boolean;         // At tier 2+
  jellyfishEnabled: boolean;    // After 60 seconds
  jellyfishCount: number;       // 0 to 3
  largeFishRatio: number;       // 0.2 to 0.5
}


// =============================================================================
// High Score Types
// =============================================================================

export interface HighScoreEntry {
  score: number;
  tier: number;
  fishEaten: number;
  timestamp: string;
}

export interface HighScoreTable {
  entries: HighScoreEntry[];  // Max 10 entries, sorted descending
}

// =============================================================================
// Spawn Configuration
// =============================================================================

export interface SpawnConfig {
  fishSpawnRate: number;
  fishSpeedMultiplier: number;
  sharkEnabled: boolean;
  crabEnabled: boolean;
  jellyfishEnabled: boolean;
  jellyfishCount: number;
  largeFishRatio: number;
}

// =============================================================================
// Game Loop Configuration
// =============================================================================

export interface GameLoopConfig {
  fixedTimestep: number;  // 16.67ms (60 FPS)
  maxFrameTime: number;   // 250ms cap
}

// =============================================================================
// Audio Types
// =============================================================================

export type SoundEffect = 'eat' | 'death' | 'levelup' | 'shark' | 'bonus' | 'extralife';

export type AudioChannel = 'music' | 'sfx';

// =============================================================================
// Renderer Types
// =============================================================================

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  interpolation: number;
  canvasWidth: number;
  canvasHeight: number;
}

// =============================================================================
// Theme Types
// =============================================================================

export type ThemeId = 'classic' | 'neon' | 'pixel' | 'deep-sea';

export type PlayerTier = 1 | 2 | 3 | 4 | 5;

export type HazardType = 'shark' | 'crab' | 'jellyfish';

export type UIType = 'life-icon' | 'bubble';

export interface ThemeInfo {
  id: ThemeId;
  name: string;           // Display name, e.g., "Classic", "Neon Glow"
  description: string;    // Brief description of the theme style
  previewImage?: string;  // Path to theme preview thumbnail
}

export interface ThemeManifest {
  id: ThemeId;
  basePath: string;       // "/assets" for classic, "/assets/themes/neon" for others
  sprites: {
    player: Record<PlayerTier, string>;   // tier -> filename
    fish: Record<FishSize, string>;       // size -> filename
    hazards: Record<HazardType, string>;  // type -> filename
    bonus: {
      seahorse: string;
    };
    ui: Record<UIType, string>;           // type -> filename
  };
}
