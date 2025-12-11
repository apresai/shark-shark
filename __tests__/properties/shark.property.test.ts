/**
 * Property-based tests for Shark Entity
 */

import * as fc from 'fast-check';
import { Shark } from '../../src/game/entities/Shark';
import { GameState, PlayerState } from '../../src/game/types';
import { CANVAS_HEIGHT, SHARK_CONFIG, TIER_DIMENSIONS } from '../../src/game/constants';

// Helper to create a minimal game state for testing
const createTestGameState = (playerPosition: { x: number; y: number }): GameState => {
  const playerState: PlayerState = {
    position: playerPosition,
    velocity: { x: 0, y: 0 },
    tier: 1,
    width: TIER_DIMENSIONS[1].width,
    height: TIER_DIMENSIONS[1].height,
    fishEaten: 0,
    facingLeft: false,
    invulnerable: false,
    invulnerableTimer: 0,
  };

  return {
    status: 'playing',
    score: 0,
    highScore: 0,
    lives: 3,
    player: playerState,
    entities: [],
    difficulty: {
      fishSpawnRate: 1.0,
      fishSpeedMultiplier: 1.0,
      sharkEnabled: true,
      sharkSpeed: 120,
      crabEnabled: false,
      jellyfishEnabled: false,
      jellyfishCount: 0,
      largeFishRatio: 0.3,
    },
    elapsedTime: 30,
  };
};

describe('Shark Entity Properties', () => {
  /**
   * **Feature: shark-shark, Property 12: Shark patrol Y constraint**
   * **Validates: Requirements 5.1**
   */
  it('Property 12: Shark patrol Y constraint - for any shark in patrol state, its Y position shall be within the upper 60% of the screen', () => {
    fc.assert(
      fc.property(
        // Generate initial shark position (use noNaN and noDefaultInfinity to avoid invalid values)
        fc.record({
          x: fc.float({ min: 0, max: 800, noNaN: true, noDefaultInfinity: true }),
          y: fc.float({ min: 0, max: CANVAS_HEIGHT, noNaN: true, noDefaultInfinity: true }),
        }),
        // Generate player position (doesn't matter for this test, but needed for update)
        fc.record({
          x: fc.float({ min: 0, max: 800, noNaN: true, noDefaultInfinity: true }),
          y: fc.float({ min: 0, max: CANVAS_HEIGHT, noNaN: true, noDefaultInfinity: true }),
        }),
        // Generate number of update cycles to run
        fc.integer({ min: 1, max: 100 }),
        (sharkPos, playerPos, updateCycles) => {
          // Create shark at the generated position
          const shark = new Shark('test-shark', sharkPos);
          
          // Force shark into patrol state (it should start in patrol, but ensure it)
          shark.state = 'patrol';
          
          // Create game state with player position
          const gameState = createTestGameState(playerPos);
          
          // Run multiple update cycles to test that patrol constraint is maintained
          for (let i = 0; i < updateCycles; i++) {
            shark.update(0.016, gameState); // 16ms delta time (60 FPS)
            
            // If shark is in patrol state, Y position must be within upper 60% of screen
            if (shark.state === 'patrol') {
              const maxPatrolY = CANVAS_HEIGHT * SHARK_CONFIG.patrolYRange;
              expect(shark.position.y).toBeLessThanOrEqual(maxPatrolY);
              
              // Also verify the shark's own method agrees
              expect(shark.isInPatrolRange(shark.position.y)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});