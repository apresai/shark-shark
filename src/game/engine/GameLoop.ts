/**
 * GameLoop - Fixed timestep game loop with interpolated rendering
 * 
 * Implements a fixed timestep loop for consistent physics updates
 * regardless of display refresh rate. Uses requestAnimationFrame for
 * smooth rendering with interpolation between physics states.
 * 
 * Requirements: 11.1, 11.3
 */

import { FIXED_TIMESTEP, MAX_FRAME_TIME } from '../constants';
import type { GameLoopConfig } from '../types';

export type UpdateCallback = (deltaTime: number) => void;
export type RenderCallback = (interpolation: number) => void;

export interface GameLoopCallbacks {
  update: UpdateCallback;
  render: RenderCallback;
}

export class GameLoop {
  private config: GameLoopConfig;
  private callbacks: GameLoopCallbacks;
  
  private running: boolean = false;
  private paused: boolean = false;
  private animationFrameId: number | null = null;
  
  private lastTime: number = 0;
  private accumulator: number = 0;
  
  constructor(callbacks: GameLoopCallbacks, config?: Partial<GameLoopConfig>) {
    this.callbacks = callbacks;
    this.config = {
      fixedTimestep: config?.fixedTimestep ?? FIXED_TIMESTEP,
      maxFrameTime: config?.maxFrameTime ?? MAX_FRAME_TIME,
    };
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    
    this.loop(this.lastTime);
  }

  /**
   * Stop the game loop completely
   */
  stop(): void {
    this.running = false;
    this.paused = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pause the game loop (keeps running but skips updates)
   */
  pause(): void {
    if (!this.running) return;
    this.paused = true;
  }

  /**
   * Resume the game loop from paused state
   */
  resume(): void {
    if (!this.running || !this.paused) return;
    
    this.paused = false;
    // Reset lastTime to prevent large delta after unpause
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  /**
   * Check if the loop is currently running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Check if the loop is currently paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Get the current configuration
   */
  getConfig(): GameLoopConfig {
    return { ...this.config };
  }

  /**
   * Main loop function called by requestAnimationFrame
   */
  private loop = (currentTime: number): void => {
    if (!this.running) return;
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
    
    // If paused, just render without updating
    if (this.paused) {
      this.callbacks.render(0);
      return;
    }
    
    // Calculate frame time and clamp to prevent spiral of death
    // Requirements 11.3: Frame time clamping at 250ms
    let frameTime = currentTime - this.lastTime;
    frameTime = Math.min(frameTime, this.config.maxFrameTime);
    this.lastTime = currentTime;
    
    // Add to accumulator
    this.accumulator += frameTime;
    
    // Fixed timestep updates
    // Requirements 11.1: Fixed timestep of 16.67ms for physics updates
    while (this.accumulator >= this.config.fixedTimestep) {
      this.callbacks.update(this.config.fixedTimestep);
      this.accumulator -= this.config.fixedTimestep;
    }
    
    // Calculate interpolation for smooth rendering
    const interpolation = this.accumulator / this.config.fixedTimestep;
    this.callbacks.render(interpolation);
  };
}

/**
 * Utility function to clamp frame time
 * Exported for testing purposes
 * 
 * Requirements 11.3: Frame time clamping
 */
export function clampFrameTime(frameTime: number, maxFrameTime: number = MAX_FRAME_TIME): number {
  return Math.min(frameTime, maxFrameTime);
}
