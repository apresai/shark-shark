/**
 * Game State Reducer
 * 
 * Manages all game state transitions and updates using React's useReducer pattern.
 * Handles state transitions: title, playing, paused, dying, respawn, gameover
 * 
 * Requirements: 10.1-10.5
 */

import type { GameState, GameAction, PlayerState, DifficultyConfig } from '../types';
import { gameLogger } from '../../lib/gameLogger';
import { 
  INITIAL_LIVES, 
  INITIAL_TIER, 
  TIER_DIMENSIONS, 
  TIER_THRESHOLDS,
  INVULNERABILITY_DURATION,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DIFFICULTY_CONFIG,
  HIGH_SCORE_STORAGE_KEY
} from '../constants';
import { ScoringSystem } from '../systems/ScoringSystem';

/**
 * Create initial player state
 */
function createInitialPlayer(): PlayerState {
  const dimensions = TIER_DIMENSIONS[INITIAL_TIER];
  
  return {
    position: { 
      x: CANVAS_WIDTH / 2, 
      y: CANVAS_HEIGHT / 2 
    },
    velocity: { x: 0, y: 0 },
    tier: INITIAL_TIER,
    width: dimensions.width,
    height: dimensions.height,
    fishEaten: 0,
    facingLeft: false,
    invulnerable: false,
    invulnerableTimer: 0,
  };
}

/**
 * Create initial difficulty configuration
 */
function createInitialDifficulty(): DifficultyConfig {
  return {
    fishSpawnRate: DIFFICULTY_CONFIG.fishSpawnRateMin,
    fishSpeedMultiplier: DIFFICULTY_CONFIG.fishSpeedMultiplierMin,
    sharkEnabled: false,
    sharkSpeed: 120,
    crabEnabled: false,
    jellyfishEnabled: false,
    jellyfishCount: 0,
    largeFishRatio: DIFFICULTY_CONFIG.largeFishRatioMin,
  };
}

/**
 * Load high score from localStorage
 */
function loadHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    if (stored) {
      const highScoreTable = JSON.parse(stored);
      if (highScoreTable.entries && highScoreTable.entries.length > 0) {
        return highScoreTable.entries[0].score;
      }
    }
  } catch (error) {
    console.warn('Failed to load high score:', error);
  }
  return 0;
}

/**
 * Create initial game state
 */
export function createInitialGameState(): GameState {
  return {
    status: 'title',
    score: 0,
    highScore: loadHighScore(),
    lives: INITIAL_LIVES,
    player: createInitialPlayer(),
    entities: [],
    difficulty: createInitialDifficulty(),
    elapsedTime: 0,
  };
}

/**
 * Reset player to tier 1 for respawn
 */
function resetPlayerForRespawn(player: PlayerState): PlayerState {
  const dimensions = TIER_DIMENSIONS[1];
  
  return {
    ...player,
    position: { 
      x: CANVAS_WIDTH / 2, 
      y: CANVAS_HEIGHT / 2 
    },
    velocity: { x: 0, y: 0 },
    tier: 1,
    width: dimensions.width,
    height: dimensions.height,
    fishEaten: 0,
    facingLeft: false,
    invulnerable: true,
    invulnerableTimer: INVULNERABILITY_DURATION,
  };
}

/**
 * Calculate tier from fish eaten count
 */
function calculateTier(fishEaten: number): 1 | 2 | 3 | 4 | 5 {
  for (let tier = 5; tier >= 1; tier--) {
    if (fishEaten >= TIER_THRESHOLDS[tier]) {
      return tier as 1 | 2 | 3 | 4 | 5;
    }
  }
  return 1;
}

/**
 * Update player dimensions based on tier
 */
function updatePlayerDimensions(player: PlayerState, tier: 1 | 2 | 3 | 4 | 5): PlayerState {
  const dimensions = TIER_DIMENSIONS[tier];
  return {
    ...player,
    tier,
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * Game state reducer
 * Handles all game state transitions and updates
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      // Requirements 10.1: Transition from title to playing
      return {
        ...createInitialGameState(),
        status: 'playing',
        highScore: state.highScore, // Preserve high score
      };

    case 'PAUSE':
      // Requirements 10.2: Pause during gameplay
      if (state.status === 'playing') {
        return {
          ...state,
          status: 'paused',
        };
      }
      return state;

    case 'RESUME':
      // Requirements 10.3: Resume from paused
      if (state.status === 'paused') {
        return {
          ...state,
          status: 'playing',
        };
      }
      return state;

    case 'PLAYER_DEATH':
      // Requirements 6.2: Decrement lives on death
      const newLives = state.lives - 1;
      gameLogger.logStateChange(state.status, newLives <= 0 ? 'gameover' : 'dying', 'PLAYER_DEATH');
      gameLogger.log('LIVES_UPDATE', { oldLives: state.lives, newLives });
      
      if (newLives <= 0) {
        // Requirements 6.5: Game over when no lives remain
        return {
          ...state,
          status: 'gameover',
          lives: 0,
        };
      } else {
        // Requirements 6.3: Transition to dying state
        return {
          ...state,
          status: 'dying',
          lives: newLives,
        };
      }

    case 'RESPAWN':
      // Transition from dying to respawn with invulnerability
      gameLogger.log('RESPAWN_ACTION', { currentStatus: state.status, lives: state.lives });
      if (state.status === 'dying' && state.lives > 0) {
        gameLogger.logStateChange('dying', 'respawn', 'RESPAWN action');
        return {
          ...state,
          status: 'respawn',
          player: resetPlayerForRespawn(state.player),
        };
      }
      gameLogger.log('RESPAWN_IGNORED', { reason: 'status not dying or no lives' });
      return state;

    case 'COMPLETE_RESPAWN':
      // Transition from respawn back to playing
      gameLogger.log('COMPLETE_RESPAWN_ACTION', { currentStatus: state.status });
      if (state.status === 'respawn') {
        gameLogger.logStateChange('respawn', 'playing', 'COMPLETE_RESPAWN action');
        return {
          ...state,
          status: 'playing',
        };
      }
      return state;

    case 'EAT_FISH':
      // Requirements 2.1, 3.1: Handle fish consumption
      const newFishEaten = state.player.fishEaten + 1;
      const newTier = calculateTier(newFishEaten);
      const updatedPlayer = updatePlayerDimensions(
        { ...state.player, fishEaten: newFishEaten },
        newTier
      );
      
      // Requirements 3.4: Check for extra life thresholds
      const previousScore = state.score;
      const newScore = state.score + action.points;
      const extraLivesEarned = ScoringSystem.checkExtraLifeThresholds(previousScore, newScore);
      
      return {
        ...state,
        score: newScore,
        lives: state.lives + extraLivesEarned,
        player: updatedPlayer,
        // Remove the eaten fish from entities
        entities: state.entities.filter(entity => entity.id !== action.fish.id),
      };

    case 'TIER_UP':
      // Requirements 2.3: Handle tier progression
      return {
        ...state,
        player: updatePlayerDimensions(state.player, action.newTier),
      };

    case 'EXTRA_LIFE':
      // Requirements 3.4: Award extra life
      return {
        ...state,
        lives: state.lives + 1,
      };

    case 'RESTART':
      // Requirements 10.5: Reset all values and start playing
      return {
        ...createInitialGameState(),
        status: 'playing',
        highScore: Math.max(state.score, state.highScore),
      };

    case 'UPDATE_PLAYER':
      // Update player state (for movement, invulnerability, etc.)
      return {
        ...state,
        player: {
          ...state.player,
          ...action.player,
        },
      };

    case 'ADD_ENTITY':
      // Add new entity to the game
      return {
        ...state,
        entities: [...state.entities, action.entity],
      };

    case 'REMOVE_ENTITY':
      // Remove entity by ID
      return {
        ...state,
        entities: state.entities.filter(entity => entity.id !== action.entityId),
      };

    case 'UPDATE_DIFFICULTY':
      // Update difficulty configuration
      return {
        ...state,
        difficulty: {
          ...state.difficulty,
          ...action.difficulty,
        },
      };

    case 'UPDATE_ELAPSED_TIME':
      // Update game elapsed time
      return {
        ...state,
        elapsedTime: action.elapsedTime,
      };

    case 'ADD_SCORE':
      // Add points to score
      // Requirements 3.4: Check for extra life thresholds
      const previousScoreForAdd = state.score;
      const newScoreForAdd = state.score + action.points;
      const extraLivesEarnedForAdd = ScoringSystem.checkExtraLifeThresholds(previousScoreForAdd, newScoreForAdd);
      
      return {
        ...state,
        score: newScoreForAdd,
        lives: state.lives + extraLivesEarnedForAdd,
        highScore: Math.max(newScoreForAdd, state.highScore),
      };

    case 'COLLECT_SEAHORSE':
      // Requirements 9.3, 9.4: Handle seahorse collection
      // Requirements 3.4: Check for extra life thresholds from score
      const previousScoreForSeahorse = state.score;
      const newScoreForSeahorse = state.score + action.points;
      const extraLivesEarnedForSeahorse = ScoringSystem.checkExtraLifeThresholds(previousScoreForSeahorse, newScoreForSeahorse);
      
      const updatedState = {
        ...state,
        score: newScoreForSeahorse,
        lives: state.lives + extraLivesEarnedForSeahorse + (action.extraLife ? 1 : 0),
      };
      
      return updatedState;

    case 'BITE_SHARK_TAIL':
      // Requirements 5.4: Handle shark tail bite
      // Requirements 3.4: Check for extra life thresholds
      const previousScoreForShark = state.score;
      const newScoreForShark = state.score + action.points;
      const extraLivesEarnedForShark = ScoringSystem.checkExtraLifeThresholds(previousScoreForShark, newScoreForShark);
      
      return {
        ...state,
        score: newScoreForShark,
        lives: state.lives + extraLivesEarnedForShark,
      };

    default:
      return state;
  }
}

/**
 * Handle respawn transition
 * Called when dying animation completes
 */
export function handleRespawn(state: GameState): GameState {
  if (state.status === 'dying' && state.lives > 0) {
    return {
      ...state,
      status: 'respawn',
      player: resetPlayerForRespawn(state.player),
    };
  }
  return state;
}

/**
 * Complete respawn and return to playing
 * Called when respawn animation/invulnerability completes
 */
export function completeRespawn(state: GameState): GameState {
  if (state.status === 'respawn') {
    return {
      ...state,
      status: 'playing',
    };
  }
  return state;
}