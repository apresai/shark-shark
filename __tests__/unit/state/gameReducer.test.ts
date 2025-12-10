/**
 * Game State Reducer Tests
 * 
 * Unit tests for the game state reducer functionality
 */

import { gameReducer, createInitialGameState, handleRespawn, completeRespawn } from '../../../src/game/state/gameReducer';
import type { GameState, GameAction, FishEntity } from '../../../src/game/types';
import { INITIAL_LIVES, INITIAL_TIER } from '../../../src/game/constants';

describe('gameReducer', () => {
  let initialState: GameState;

  beforeEach(() => {
    initialState = createInitialGameState();
  });

  describe('START_GAME', () => {
    it('should transition from title to playing', () => {
      const action: GameAction = { type: 'START_GAME' };
      const result = gameReducer(initialState, action);
      
      expect(result.status).toBe('playing');
      expect(result.lives).toBe(INITIAL_LIVES);
      expect(result.player.tier).toBe(INITIAL_TIER);
      expect(result.score).toBe(0);
    });

    it('should preserve high score when starting new game', () => {
      const stateWithHighScore = { ...initialState, highScore: 5000 };
      const action: GameAction = { type: 'START_GAME' };
      const result = gameReducer(stateWithHighScore, action);
      
      expect(result.highScore).toBe(5000);
    });
  });

  describe('PAUSE and RESUME', () => {
    it('should pause when playing', () => {
      const playingState = { ...initialState, status: 'playing' as const };
      const pauseAction: GameAction = { type: 'PAUSE' };
      const result = gameReducer(playingState, pauseAction);
      
      expect(result.status).toBe('paused');
    });

    it('should not pause when not playing', () => {
      const titleState = { ...initialState, status: 'title' as const };
      const pauseAction: GameAction = { type: 'PAUSE' };
      const result = gameReducer(titleState, pauseAction);
      
      expect(result.status).toBe('title');
    });

    it('should resume when paused', () => {
      const pausedState = { ...initialState, status: 'paused' as const };
      const resumeAction: GameAction = { type: 'RESUME' };
      const result = gameReducer(pausedState, resumeAction);
      
      expect(result.status).toBe('playing');
    });

    it('should not resume when not paused', () => {
      const playingState = { ...initialState, status: 'playing' as const };
      const resumeAction: GameAction = { type: 'RESUME' };
      const result = gameReducer(playingState, resumeAction);
      
      expect(result.status).toBe('playing');
    });
  });

  describe('PLAYER_DEATH', () => {
    it('should decrement lives and transition to dying', () => {
      const playingState = { ...initialState, status: 'playing' as const, lives: 3 };
      const deathAction: GameAction = { type: 'PLAYER_DEATH' };
      const result = gameReducer(playingState, deathAction);
      
      expect(result.lives).toBe(2);
      expect(result.status).toBe('dying');
    });

    it('should transition to gameover when no lives remain', () => {
      const lastLifeState = { ...initialState, status: 'playing' as const, lives: 1 };
      const deathAction: GameAction = { type: 'PLAYER_DEATH' };
      const result = gameReducer(lastLifeState, deathAction);
      
      expect(result.lives).toBe(0);
      expect(result.status).toBe('gameover');
    });
  });

  describe('EAT_FISH', () => {
    it('should increase score and fish eaten count', () => {
      const mockFish: FishEntity = {
        id: 'fish-1',
        type: 'fish',
        size: 'small',
        points: 25,
        position: { x: 100, y: 100 },
        velocity: { x: 50, y: 0 },
        width: 20,
        height: 15,
        active: true,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: jest.fn(),
      };

      const stateWithFish = {
        ...initialState,
        entities: [mockFish],
      };

      const eatAction: GameAction = { 
        type: 'EAT_FISH', 
        fish: mockFish, 
        points: 25 
      };
      
      const result = gameReducer(stateWithFish, eatAction);
      
      expect(result.score).toBe(25);
      expect(result.player.fishEaten).toBe(1);
      expect(result.entities).toHaveLength(0); // Fish should be removed
    });

    it('should update tier when reaching threshold', () => {
      const playerWithFish = {
        ...initialState.player,
        fishEaten: 4, // One away from tier 2 threshold (5)
      };
      
      const stateNearTierUp = {
        ...initialState,
        player: playerWithFish,
      };

      const mockFish: FishEntity = {
        id: 'fish-1',
        type: 'fish',
        size: 'small',
        points: 25,
        position: { x: 100, y: 100 },
        velocity: { x: 50, y: 0 },
        width: 20,
        height: 15,
        active: true,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: jest.fn(),
      };

      const eatAction: GameAction = { 
        type: 'EAT_FISH', 
        fish: mockFish, 
        points: 25 
      };
      
      const result = gameReducer(stateNearTierUp, eatAction);
      
      expect(result.player.fishEaten).toBe(5);
      expect(result.player.tier).toBe(2);
    });

    it('should award extra lives when eating fish crosses score thresholds', () => {
      const mockFish: FishEntity = {
        id: 'fish-1',
        type: 'fish',
        size: 'large',
        points: 100,
        position: { x: 100, y: 100 },
        velocity: { x: 50, y: 0 },
        width: 40,
        height: 30,
        active: true,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: jest.fn(),
      };

      const stateNearThreshold = {
        ...initialState,
        score: 9950, // Close to 10k threshold
        lives: 3,
        entities: [mockFish],
      };

      const eatAction: GameAction = { 
        type: 'EAT_FISH', 
        fish: mockFish, 
        points: 100 // This will cross 10k threshold
      };
      
      const result = gameReducer(stateNearThreshold, eatAction);
      
      expect(result.score).toBe(10050);
      expect(result.lives).toBe(4); // Should gain 1 extra life
    });
  });

  describe('EXTRA_LIFE', () => {
    it('should increment lives', () => {
      const action: GameAction = { type: 'EXTRA_LIFE' };
      const result = gameReducer(initialState, action);
      
      expect(result.lives).toBe(initialState.lives + 1);
    });
  });

  describe('RESTART', () => {
    it('should reset to initial state but preserve high score', () => {
      const gameOverState = {
        ...initialState,
        status: 'gameover' as const,
        score: 1000,
        highScore: 5000,
        lives: 0,
        player: {
          ...initialState.player,
          tier: 3 as const,
          fishEaten: 20,
        },
      };

      const restartAction: GameAction = { type: 'RESTART' };
      const result = gameReducer(gameOverState, restartAction);
      
      expect(result.status).toBe('playing');
      expect(result.score).toBe(0);
      expect(result.highScore).toBe(5000); // Should preserve high score
      expect(result.lives).toBe(INITIAL_LIVES);
      expect(result.player.tier).toBe(INITIAL_TIER);
      expect(result.player.fishEaten).toBe(0);
    });

    it('should update high score if current score is higher', () => {
      const gameOverState = {
        ...initialState,
        status: 'gameover' as const,
        score: 10000,
        highScore: 5000,
      };

      const restartAction: GameAction = { type: 'RESTART' };
      const result = gameReducer(gameOverState, restartAction);
      
      expect(result.highScore).toBe(10000);
    });
  });

  describe('ADD_SCORE', () => {
    it('should add points to score', () => {
      const action: GameAction = { type: 'ADD_SCORE', points: 500 };
      const result = gameReducer(initialState, action);
      
      expect(result.score).toBe(500);
    });

    it('should update high score if new score is higher', () => {
      const stateWithScore = { ...initialState, score: 8000, highScore: 5000 };
      const action: GameAction = { type: 'ADD_SCORE', points: 500 };
      const result = gameReducer(stateWithScore, action);
      
      expect(result.score).toBe(8500);
      expect(result.highScore).toBe(8500);
    });

    it('should award extra lives when crossing thresholds', () => {
      const stateNearThreshold = { ...initialState, score: 8000, lives: 3 };
      const action: GameAction = { type: 'ADD_SCORE', points: 5000 }; // Cross 10k threshold
      const result = gameReducer(stateNearThreshold, action);
      
      expect(result.score).toBe(13000);
      expect(result.lives).toBe(4); // Should gain 1 extra life
    });

    it('should award multiple extra lives when crossing multiple thresholds', () => {
      const stateNearThreshold = { ...initialState, score: 5000, lives: 3 };
      const action: GameAction = { type: 'ADD_SCORE', points: 30000 }; // Cross 10k and 30k thresholds
      const result = gameReducer(stateNearThreshold, action);
      
      expect(result.score).toBe(35000);
      expect(result.lives).toBe(5); // Should gain 2 extra lives
    });
  });

  describe('COLLECT_SEAHORSE', () => {
    it('should add points and extra life when specified', () => {
      const action: GameAction = { 
        type: 'COLLECT_SEAHORSE', 
        points: 200, 
        extraLife: true 
      };
      const result = gameReducer(initialState, action);
      
      expect(result.score).toBe(200);
      expect(result.lives).toBe(initialState.lives + 1);
    });

    it('should add points without extra life when not specified', () => {
      const action: GameAction = { 
        type: 'COLLECT_SEAHORSE', 
        points: 200, 
        extraLife: false 
      };
      const result = gameReducer(initialState, action);
      
      expect(result.score).toBe(200);
      expect(result.lives).toBe(initialState.lives);
    });

    it('should award extra lives from both score thresholds and seahorse bonus', () => {
      const stateNearThreshold = { ...initialState, score: 9900, lives: 3 };
      const action: GameAction = { 
        type: 'COLLECT_SEAHORSE', 
        points: 200, // Cross 10k threshold
        extraLife: true // Plus seahorse bonus life
      };
      const result = gameReducer(stateNearThreshold, action);
      
      expect(result.score).toBe(10100);
      expect(result.lives).toBe(5); // Should gain 2 extra lives (1 from threshold + 1 from seahorse)
    });

    it('should award extra lives from score thresholds even without seahorse bonus', () => {
      const stateNearThreshold = { ...initialState, score: 9900, lives: 3 };
      const action: GameAction = { 
        type: 'COLLECT_SEAHORSE', 
        points: 200, // Cross 10k threshold
        extraLife: false // No seahorse bonus life
      };
      const result = gameReducer(stateNearThreshold, action);
      
      expect(result.score).toBe(10100);
      expect(result.lives).toBe(4); // Should gain 1 extra life from threshold only
    });
  });

  describe('BITE_SHARK_TAIL', () => {
    it('should add shark tail points to score', () => {
      const action: GameAction = { type: 'BITE_SHARK_TAIL', points: 500 };
      const result = gameReducer(initialState, action);
      
      expect(result.score).toBe(500);
    });

    it('should award extra lives when shark tail points cross thresholds', () => {
      const stateNearThreshold = { ...initialState, score: 9600, lives: 3 };
      const action: GameAction = { type: 'BITE_SHARK_TAIL', points: 500 }; // Cross 10k threshold
      const result = gameReducer(stateNearThreshold, action);
      
      expect(result.score).toBe(10100);
      expect(result.lives).toBe(4); // Should gain 1 extra life
    });
  });
});

describe('handleRespawn', () => {
  it('should transition from dying to respawn and reset player', () => {
    const dyingState: GameState = {
      ...createInitialGameState(),
      status: 'dying',
      lives: 2,
      player: {
        ...createInitialGameState().player,
        tier: 3,
        fishEaten: 20,
        invulnerable: false,
      },
    };

    const result = handleRespawn(dyingState);
    
    expect(result.status).toBe('respawn');
    expect(result.player.tier).toBe(1);
    expect(result.player.fishEaten).toBe(0);
    expect(result.player.invulnerable).toBe(true);
    expect(result.player.invulnerableTimer).toBe(2);
  });

  it('should not change state if not dying', () => {
    const playingState: GameState = {
      ...createInitialGameState(),
      status: 'playing',
    };

    const result = handleRespawn(playingState);
    expect(result).toBe(playingState);
  });
});

describe('completeRespawn', () => {
  it('should transition from respawn to playing', () => {
    const respawnState: GameState = {
      ...createInitialGameState(),
      status: 'respawn',
    };

    const result = completeRespawn(respawnState);
    expect(result.status).toBe('playing');
  });

  it('should not change state if not respawning', () => {
    const playingState: GameState = {
      ...createInitialGameState(),
      status: 'playing',
    };

    const result = completeRespawn(playingState);
    expect(result).toBe(playingState);
  });
});