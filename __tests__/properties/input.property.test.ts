/**
 * Property-based tests for Input System
 */

import * as fc from 'fast-check';
import { InputManager } from '../../src/game/engine/InputManager';

// Mock DOM events
const createKeyboardEvent = (type: 'keydown' | 'keyup', code: string): KeyboardEvent => {
  return new KeyboardEvent(type, { code, bubbles: true });
};

describe('Input System Properties', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    inputManager = new InputManager();
    inputManager.initialize();
  });

  afterEach(() => {
    inputManager.destroy();
  });

  /**
   * **Feature: shark-shark, Property 1: Input direction mapping**
   * **Validates: Requirements 1.1**
   */
  it('Property 1: Input direction mapping - for any combination of directional inputs, the resulting velocity vector direction shall match the expected 8-directional movement pattern', () => {
    fc.assert(
      fc.property(
        fc.record({
          up: fc.boolean(),
          down: fc.boolean(),
          left: fc.boolean(),
          right: fc.boolean(),
        }),
        (inputCombination) => {
          // Clear all previous input by creating a fresh InputManager
          inputManager.destroy();
          inputManager = new InputManager();
          inputManager.initialize();

          // Apply the input combination
          if (inputCombination.up) {
            document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
          }
          if (inputCombination.down) {
            document.dispatchEvent(createKeyboardEvent('keydown', 'KeyS'));
          }
          if (inputCombination.left) {
            document.dispatchEvent(createKeyboardEvent('keydown', 'KeyA'));
          }
          if (inputCombination.right) {
            document.dispatchEvent(createKeyboardEvent('keydown', 'KeyD'));
          }

          const vector = inputManager.getVector();
          const state = inputManager.getState();

          // Verify state matches input
          expect(state.up).toBe(inputCombination.up);
          expect(state.down).toBe(inputCombination.down);
          expect(state.left).toBe(inputCombination.left);
          expect(state.right).toBe(inputCombination.right);

          // Calculate expected vector
          let expectedX = 0;
          let expectedY = 0;

          if (inputCombination.left) expectedX -= 1;
          if (inputCombination.right) expectedX += 1;
          if (inputCombination.up) expectedY -= 1;
          if (inputCombination.down) expectedY += 1;

          // Handle conflicting inputs (up+down or left+right cancel out)
          if (inputCombination.up && inputCombination.down) expectedY = 0;
          if (inputCombination.left && inputCombination.right) expectedX = 0;

          // Normalize diagonal movement
          if (expectedX !== 0 && expectedY !== 0) {
            const magnitude = Math.sqrt(expectedX * expectedX + expectedY * expectedY);
            expectedX /= magnitude;
            expectedY /= magnitude;
          }

          // Verify vector matches expected direction
          expect(vector.x).toBeCloseTo(expectedX, 5);
          expect(vector.y).toBeCloseTo(expectedY, 5);

          // Verify vector magnitude is at most 1 (normalized)
          const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
          expect(magnitude).toBeLessThanOrEqual(1.0001); // Small tolerance for floating point

          // If there's any input, magnitude should be exactly 1 (unless conflicting inputs cancel out)
          if ((expectedX !== 0 || expectedY !== 0)) {
            expect(magnitude).toBeCloseTo(1, 5);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});