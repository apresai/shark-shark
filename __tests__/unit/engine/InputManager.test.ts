/**
 * Unit tests for InputManager
 */

import { InputManager } from '../../../src/game/engine/InputManager';

// Mock DOM events
const createKeyboardEvent = (type: 'keydown' | 'keyup', code: string): KeyboardEvent => {
  return new KeyboardEvent(type, { code, bubbles: true });
};

describe('InputManager', () => {
  let inputManager: InputManager;

  beforeEach(() => {
    inputManager = new InputManager();
    inputManager.initialize();
  });

  afterEach(() => {
    inputManager.destroy();
  });

  describe('keyboard input', () => {
    it('should detect WASD keys', () => {
      // Press W key
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
      const state = inputManager.getState();
      expect(state.up).toBe(true);
      expect(state.down).toBe(false);
      expect(state.left).toBe(false);
      expect(state.right).toBe(false);

      // Release W key
      document.dispatchEvent(createKeyboardEvent('keyup', 'KeyW'));
      const stateAfter = inputManager.getState();
      expect(stateAfter.up).toBe(false);
    });

    it('should detect Arrow keys', () => {
      // Press Arrow Up
      document.dispatchEvent(createKeyboardEvent('keydown', 'ArrowUp'));
      const state = inputManager.getState();
      expect(state.up).toBe(true);

      // Press Arrow Right
      document.dispatchEvent(createKeyboardEvent('keydown', 'ArrowRight'));
      const stateWithBoth = inputManager.getState();
      expect(stateWithBoth.up).toBe(true);
      expect(stateWithBoth.right).toBe(true);
    });

    it('should handle multiple simultaneous keys', () => {
      // Press W and D simultaneously
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyD'));
      
      const state = inputManager.getState();
      expect(state.up).toBe(true);
      expect(state.right).toBe(true);
      expect(state.down).toBe(false);
      expect(state.left).toBe(false);
    });

    it('should detect pause key', () => {
      document.dispatchEvent(createKeyboardEvent('keydown', 'Escape'));
      const state = inputManager.getState();
      expect(state.pause).toBe(true);
    });
  });

  describe('input vector calculation', () => {
    it('should return zero vector when no keys pressed', () => {
      const vector = inputManager.getVector();
      expect(vector.x).toBe(0);
      expect(vector.y).toBe(0);
    });

    it('should return correct cardinal directions', () => {
      // Up
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
      let vector = inputManager.getVector();
      expect(vector.x).toBe(0);
      expect(vector.y).toBe(-1);

      // Reset
      document.dispatchEvent(createKeyboardEvent('keyup', 'KeyW'));

      // Right
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyD'));
      vector = inputManager.getVector();
      expect(vector.x).toBe(1);
      expect(vector.y).toBe(0);
    });

    it('should normalize diagonal movement', () => {
      // Press up and right simultaneously
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyD'));
      
      const vector = inputManager.getVector();
      
      // Should be normalized (magnitude = 1)
      const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
      expect(magnitude).toBeCloseTo(1, 5);
      
      // Should be in the correct direction (up-right)
      expect(vector.x).toBeGreaterThan(0);
      expect(vector.y).toBeLessThan(0);
    });

    it('should handle all 8 directions correctly', () => {
      const directions = [
        { keys: ['KeyW'], expected: { x: 0, y: -1 } },           // Up
        { keys: ['KeyW', 'KeyD'], expected: { x: 1/Math.sqrt(2), y: -1/Math.sqrt(2) } }, // Up-Right
        { keys: ['KeyD'], expected: { x: 1, y: 0 } },            // Right
        { keys: ['KeyS', 'KeyD'], expected: { x: 1/Math.sqrt(2), y: 1/Math.sqrt(2) } },  // Down-Right
        { keys: ['KeyS'], expected: { x: 0, y: 1 } },            // Down
        { keys: ['KeyS', 'KeyA'], expected: { x: -1/Math.sqrt(2), y: 1/Math.sqrt(2) } }, // Down-Left
        { keys: ['KeyA'], expected: { x: -1, y: 0 } },           // Left
        { keys: ['KeyW', 'KeyA'], expected: { x: -1/Math.sqrt(2), y: -1/Math.sqrt(2) } }, // Up-Left
      ];

      directions.forEach(({ keys, expected }) => {
        // Clear all keys first
        inputManager.destroy();
        inputManager.initialize();
        
        // Press the test keys
        keys.forEach(key => {
          document.dispatchEvent(createKeyboardEvent('keydown', key));
        });
        
        const vector = inputManager.getVector();
        expect(vector.x).toBeCloseTo(expected.x, 5);
        expect(vector.y).toBeCloseTo(expected.y, 5);
      });
    });
  });

  describe('touch input', () => {
    it('should handle touch vector input', () => {
      const touchVector = { x: 0.5, y: -0.8 };
      inputManager.setTouchVector(touchVector);
      
      const vector = inputManager.getVector();
      expect(vector.x).toBeCloseTo(touchVector.x, 5);
      expect(vector.y).toBeCloseTo(touchVector.y, 5);
    });

    it('should prioritize touch input over keyboard when active', () => {
      // Press keyboard key
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyD'));
      
      // Set touch input
      const touchVector = { x: -0.5, y: 0.3 };
      inputManager.setTouchVector(touchVector);
      
      const vector = inputManager.getVector();
      expect(vector.x).toBeCloseTo(touchVector.x, 5);
      expect(vector.y).toBeCloseTo(touchVector.y, 5);
    });

    it('should fall back to keyboard when touch input is below deadzone', () => {
      // Press keyboard key
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyD'));
      
      // Set very small touch input (below deadzone)
      inputManager.setTouchVector({ x: 0.05, y: 0.05 });
      
      const vector = inputManager.getVector();
      expect(vector.x).toBe(1); // Should use keyboard input
      expect(vector.y).toBe(0);
    });

    it('should update input source based on active input', () => {
      expect(inputManager.getSource()).toBe('keyboard');
      
      // Set significant touch input
      inputManager.setTouchVector({ x: 0.5, y: 0.5 });
      expect(inputManager.getSource()).toBe('touch');
      
      // Clear touch input and press keyboard
      inputManager.setTouchVector({ x: 0, y: 0 });
      document.dispatchEvent(createKeyboardEvent('keydown', 'KeyW'));
      expect(inputManager.getSource()).toBe('keyboard');
    });
  });

  describe('input source', () => {
    it('should return keyboard as default source', () => {
      expect(inputManager.getSource()).toBe('keyboard');
    });
  });

  describe('lifecycle', () => {
    it('should initialize and destroy cleanly', () => {
      const manager = new InputManager();
      expect(() => manager.initialize()).not.toThrow();
      expect(() => manager.destroy()).not.toThrow();
      expect(() => manager.destroy()).not.toThrow(); // Should handle multiple destroys
    });
  });
});