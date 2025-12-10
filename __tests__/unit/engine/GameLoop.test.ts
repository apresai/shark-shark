/**
 * Unit tests for GameLoop class
 * Tests the fixed timestep game loop implementation
 */

import { GameLoop, clampFrameTime, GameLoopCallbacks } from '../../../src/game/engine/GameLoop';
import { FIXED_TIMESTEP, MAX_FRAME_TIME } from '../../../src/game/constants';

describe('GameLoop', () => {
  let updateMock: jest.Mock;
  let renderMock: jest.Mock;
  let callbacks: GameLoopCallbacks;

  beforeEach(() => {
    updateMock = jest.fn();
    renderMock = jest.fn();
    callbacks = {
      update: updateMock,
      render: renderMock,
    };
    
    // Mock requestAnimationFrame and cancelAnimationFrame
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return setTimeout(() => cb(performance.now()), 0) as unknown as number;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use default config values when not provided', () => {
      const loop = new GameLoop(callbacks);
      const config = loop.getConfig();
      
      expect(config.fixedTimestep).toBe(FIXED_TIMESTEP);
      expect(config.maxFrameTime).toBe(MAX_FRAME_TIME);
    });

    it('should use custom config values when provided', () => {
      const customConfig = { fixedTimestep: 20, maxFrameTime: 300 };
      const loop = new GameLoop(callbacks, customConfig);
      const config = loop.getConfig();
      
      expect(config.fixedTimestep).toBe(20);
      expect(config.maxFrameTime).toBe(300);
    });
  });

  describe('start/stop', () => {
    it('should set running state to true when started', () => {
      const loop = new GameLoop(callbacks);
      
      expect(loop.isRunning()).toBe(false);
      loop.start();
      expect(loop.isRunning()).toBe(true);
      loop.stop();
    });

    it('should set running state to false when stopped', () => {
      const loop = new GameLoop(callbacks);
      
      loop.start();
      expect(loop.isRunning()).toBe(true);
      loop.stop();
      expect(loop.isRunning()).toBe(false);
    });

    it('should not start twice if already running', () => {
      const loop = new GameLoop(callbacks);
      
      loop.start();
      loop.start(); // Should be ignored
      expect(loop.isRunning()).toBe(true);
      loop.stop();
    });
  });

  describe('pause/resume', () => {
    it('should set paused state when paused', () => {
      const loop = new GameLoop(callbacks);
      
      loop.start();
      expect(loop.isPaused()).toBe(false);
      loop.pause();
      expect(loop.isPaused()).toBe(true);
      loop.stop();
    });

    it('should clear paused state when resumed', () => {
      const loop = new GameLoop(callbacks);
      
      loop.start();
      loop.pause();
      expect(loop.isPaused()).toBe(true);
      loop.resume();
      expect(loop.isPaused()).toBe(false);
      loop.stop();
    });

    it('should not pause if not running', () => {
      const loop = new GameLoop(callbacks);
      
      loop.pause();
      expect(loop.isPaused()).toBe(false);
    });

    it('should not resume if not running', () => {
      const loop = new GameLoop(callbacks);
      
      loop.resume();
      expect(loop.isPaused()).toBe(false);
    });

    it('should not resume if not paused', () => {
      const loop = new GameLoop(callbacks);
      
      loop.start();
      loop.resume(); // Should be ignored since not paused
      expect(loop.isPaused()).toBe(false);
      loop.stop();
    });
  });

  describe('stop clears state', () => {
    it('should clear paused state when stopped', () => {
      const loop = new GameLoop(callbacks);
      
      loop.start();
      loop.pause();
      expect(loop.isPaused()).toBe(true);
      loop.stop();
      expect(loop.isPaused()).toBe(false);
    });
  });
});

describe('clampFrameTime', () => {
  it('should return frameTime when below max', () => {
    expect(clampFrameTime(100, 250)).toBe(100);
    expect(clampFrameTime(16.67, 250)).toBe(16.67);
    expect(clampFrameTime(0, 250)).toBe(0);
  });

  it('should clamp frameTime to max when above', () => {
    expect(clampFrameTime(300, 250)).toBe(250);
    expect(clampFrameTime(500, 250)).toBe(250);
    expect(clampFrameTime(1000, 250)).toBe(250);
  });

  it('should return exactly max when equal', () => {
    expect(clampFrameTime(250, 250)).toBe(250);
  });

  it('should use default MAX_FRAME_TIME when not provided', () => {
    expect(clampFrameTime(100)).toBe(100);
    expect(clampFrameTime(300)).toBe(MAX_FRAME_TIME);
  });
});
