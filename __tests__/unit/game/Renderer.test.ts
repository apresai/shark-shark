/**
 * Renderer Class Tests
 * 
 * Tests for the Renderer class including interpolation and entity rendering.
 */

import { Renderer } from '../../../src/game/Renderer';
import { GameState, PlayerState, Entity, DifficultyConfig } from '../../../src/game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TIER_DIMENSIONS, INITIAL_TIER } from '../../../src/game/constants';

// Mock canvas context
function createMockContext(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    fillText: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
    ellipse: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    translate: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;
}

function createMockPlayer(): PlayerState {
  const dimensions = TIER_DIMENSIONS[INITIAL_TIER];
  return {
    position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
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

function createMockDifficulty(): DifficultyConfig {
  return {
    fishSpawnRate: 0.8,
    fishSpeedMultiplier: 1.0,
    sharkEnabled: false,
    sharkSpeed: 120,
    crabEnabled: false,
    jellyfishEnabled: false,
    jellyfishCount: 0,
    largeFishRatio: 0.2,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    status: 'playing',
    score: 0,
    highScore: 0,
    lives: 3,
    player: createMockPlayer(),
    entities: [],
    difficulty: createMockDifficulty(),
    elapsedTime: 0,
    ...overrides,
  };
}

describe('Renderer', () => {
  let ctx: CanvasRenderingContext2D;
  let renderer: Renderer;

  beforeEach(() => {
    ctx = createMockContext();
    renderer = new Renderer(ctx);
  });

  describe('initialization', () => {
    it('should create a renderer with default config', () => {
      expect(renderer).toBeInstanceOf(Renderer);
    });

    it('should accept custom config', () => {
      const customRenderer = new Renderer(ctx, {
        debug: true,
        backgroundColor: '#000000',
      });
      expect(customRenderer).toBeInstanceOf(Renderer);
    });
  });

  describe('clear', () => {
    it('should clear the canvas with background color', () => {
      renderer.clear();
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    });
  });

  describe('render', () => {
    it('should render without errors', () => {
      const state = createMockGameState();
      expect(() => renderer.render(state)).not.toThrow();
    });

    it('should call fillRect for background', () => {
      const state = createMockGameState();
      renderer.render(state);
      expect(ctx.fillRect).toHaveBeenCalled();
    });

    it('should render player', () => {
      const state = createMockGameState();
      renderer.render(state);
      // Player rendering calls save/restore
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('should handle interpolation parameter', () => {
      const state = createMockGameState();
      expect(() => renderer.render(state, 0.5)).not.toThrow();
    });
  });

  describe('setContext', () => {
    it('should update the rendering context', () => {
      const newCtx = createMockContext();
      renderer.setContext(newCtx);
      renderer.clear();
      expect(newCtx.fillRect).toHaveBeenCalled();
    });
  });

  describe('setConfig', () => {
    it('should update configuration', () => {
      renderer.setConfig({ debug: true });
      // Config is internal, but we can verify it doesn't throw
      expect(() => renderer.render(createMockGameState())).not.toThrow();
    });
  });

  describe('interpolatePosition', () => {
    it('should interpolate between two positions', () => {
      const prev = { x: 0, y: 0 };
      const current = { x: 100, y: 100 };
      
      const result = renderer.interpolatePosition(prev, current, 0.5);
      
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });

    it('should return prev position at t=0', () => {
      const prev = { x: 10, y: 20 };
      const current = { x: 100, y: 200 };
      
      const result = renderer.interpolatePosition(prev, current, 0);
      
      expect(result.x).toBe(10);
      expect(result.y).toBe(20);
    });

    it('should return current position at t=1', () => {
      const prev = { x: 10, y: 20 };
      const current = { x: 100, y: 200 };
      
      const result = renderer.interpolatePosition(prev, current, 1);
      
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });
  });

  describe('entity rendering', () => {
    it('should render entities in correct order', () => {
      const mockEntity: Entity = {
        id: 'test-fish',
        type: 'fish',
        position: { x: 100, y: 100 },
        velocity: { x: 50, y: 0 },
        width: 20,
        height: 15,
        active: true,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: () => ({ x: 90, y: 92.5, width: 20, height: 15 }),
      };

      const state = createMockGameState({ entities: [mockEntity] });
      renderer.render(state);

      expect(mockEntity.render).toHaveBeenCalledWith(ctx, 0);
    });

    it('should not render inactive entities', () => {
      const mockEntity: Entity = {
        id: 'test-fish',
        type: 'fish',
        position: { x: 100, y: 100 },
        velocity: { x: 50, y: 0 },
        width: 20,
        height: 15,
        active: false, // Inactive
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: () => ({ x: 90, y: 92.5, width: 20, height: 15 }),
      };

      const state = createMockGameState({ entities: [mockEntity] });
      renderer.render(state);

      expect(mockEntity.render).not.toHaveBeenCalled();
    });
  });

  describe('player rendering', () => {
    it('should handle invulnerable player', () => {
      const state = createMockGameState({
        player: {
          ...createMockPlayer(),
          invulnerable: true,
          invulnerableTimer: 1.5,
        },
      });

      expect(() => renderer.render(state)).not.toThrow();
    });

    it('should handle facing left player', () => {
      const state = createMockGameState({
        player: {
          ...createMockPlayer(),
          facingLeft: true,
        },
      });

      renderer.render(state);
      expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
    });
  });

  describe('entity type render methods', () => {
    it('should render fish without errors', () => {
      expect(() => renderer.renderFish(100, 100, 20, 15, 'small', false)).not.toThrow();
      expect(ctx.fillRect).toHaveBeenCalled();
    });

    it('should render shark without errors', () => {
      expect(() => renderer.renderShark(200, 150, 96, 48, false, 'patrol')).not.toThrow();
      expect(ctx.fillRect).toHaveBeenCalled();
    });

    it('should render crab without errors', () => {
      expect(() => renderer.renderCrab(100, 580, 24, 16, false)).not.toThrow();
      expect(ctx.fillRect).toHaveBeenCalled();
    });

    it('should render jellyfish without errors', () => {
      expect(() => renderer.renderJellyfish(150, 300, 20, 28)).not.toThrow();
      expect(ctx.ellipse).toHaveBeenCalled();
    });

    it('should render seahorse without errors', () => {
      expect(() => renderer.renderSeahorse(200, 250, 16, 24)).not.toThrow();
      expect(ctx.ellipse).toHaveBeenCalled();
    });
  });

  describe('interpolation helpers', () => {
    it('should get interpolated entity position for known entity', () => {
      const mockEntity: Entity = {
        id: 'test-entity',
        type: 'fish',
        position: { x: 200, y: 200 },
        velocity: { x: 50, y: 0 },
        width: 20,
        height: 15,
        active: true,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: () => ({ x: 190, y: 192.5, width: 20, height: 15 }),
      };

      // First render to store positions
      const state1 = createMockGameState({ entities: [mockEntity] });
      renderer.render(state1, 0);

      // Update entity position
      mockEntity.position = { x: 300, y: 200 };

      // Get interpolated position at 0.5
      const interpolated = renderer.getInterpolatedEntityPosition(mockEntity, 0.5);
      expect(interpolated.x).toBe(250); // Midpoint between 200 and 300
      expect(interpolated.y).toBe(200);
    });

    it('should return current position for unknown entity', () => {
      const mockEntity: Entity = {
        id: 'new-entity',
        type: 'fish',
        position: { x: 100, y: 100 },
        velocity: { x: 50, y: 0 },
        width: 20,
        height: 15,
        active: true,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: () => ({ x: 90, y: 92.5, width: 20, height: 15 }),
      };

      const interpolated = renderer.getInterpolatedEntityPosition(mockEntity, 0.5);
      expect(interpolated.x).toBe(100);
      expect(interpolated.y).toBe(100);
    });
  });

  describe('debug rendering', () => {
    it('should render entity hitboxes when debug is enabled', () => {
      const debugRenderer = new Renderer(ctx, { debug: true });
      
      const mockEntity: Entity = {
        id: 'test-fish',
        type: 'fish',
        position: { x: 100, y: 100 },
        velocity: { x: 50, y: 0 },
        width: 20,
        height: 15,
        active: true,
        update: jest.fn(),
        render: jest.fn(),
        getBoundingBox: () => ({ x: 90, y: 92.5, width: 20, height: 15 }),
      };

      const state = createMockGameState({ entities: [mockEntity] });
      debugRenderer.render(state);

      // Should call strokeRect for debug hitbox
      expect(ctx.strokeRect).toHaveBeenCalled();
    });
  });
});
