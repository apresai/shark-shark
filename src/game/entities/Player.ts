/**
 * Player Entity - The user-controlled fish
 */

import { Entity, PlayerState, Vector2D, BoundingBox, GameState } from '../types';
import {
  TIER_DIMENSIONS,
  TIER_THRESHOLDS,
  PLAYER_BASE_SPEED,
  PLAYER_TIER_SPEED_BONUS,
  PLAYER_FRICTION,
  PLAYER_ACCELERATION,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  MAX_TIER,
  INITIAL_TIER,
  INVULNERABILITY_DURATION
} from '../constants';
import { clampMagnitude, lerp } from '../../lib/math';
import { spriteLoader, PlayerTier } from '../SpriteLoader';

export class Player implements Entity {
  public readonly id: string;
  public readonly type = 'player' as const;
  public position: Vector2D;
  public velocity: Vector2D;
  public width: number;
  public height: number;
  public active: boolean = true;

  // Player-specific state
  public tier: 1 | 2 | 3 | 4 | 5;
  public fishEaten: number;
  public facingLeft: boolean;
  public invulnerable: boolean;
  public invulnerableTimer: number;

  constructor(id: string, initialState?: Partial<PlayerState>) {
    this.id = id;
    
    // Initialize with default values
    this.tier = initialState?.tier ?? INITIAL_TIER;
    this.fishEaten = initialState?.fishEaten ?? 0;
    this.facingLeft = initialState?.facingLeft ?? false;
    this.invulnerable = initialState?.invulnerable ?? false;
    this.invulnerableTimer = initialState?.invulnerableTimer ?? 0;

    // Set dimensions based on tier
    const dimensions = TIER_DIMENSIONS[this.tier];
    this.width = dimensions.width;
    this.height = dimensions.height;

    // Initialize position and velocity
    this.position = initialState?.position ?? {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2
    };
    this.velocity = initialState?.velocity ?? { x: 0, y: 0 };
  }

  /**
   * Get the current player state
   */
  getState(): PlayerState {
    return {
      position: { ...this.position },
      velocity: { ...this.velocity },
      tier: this.tier,
      width: this.width,
      height: this.height,
      fishEaten: this.fishEaten,
      facingLeft: this.facingLeft,
      invulnerable: this.invulnerable,
      invulnerableTimer: this.invulnerableTimer
    };
  }

  /**
   * Update player state from external PlayerState
   */
  setState(state: Partial<PlayerState>): void {
    if (state.position) this.position = { ...state.position };
    if (state.velocity) this.velocity = { ...state.velocity };
    if (state.tier !== undefined) {
      this.tier = state.tier;
      const dimensions = TIER_DIMENSIONS[this.tier];
      this.width = dimensions.width;
      this.height = dimensions.height;
    }
    if (state.fishEaten !== undefined) this.fishEaten = state.fishEaten;
    if (state.facingLeft !== undefined) this.facingLeft = state.facingLeft;
    if (state.invulnerable !== undefined) this.invulnerable = state.invulnerable;
    if (state.invulnerableTimer !== undefined) this.invulnerableTimer = state.invulnerableTimer;
  }

  /**
   * Apply input to player movement
   */
  applyInput(inputVector: Vector2D, deltaTime: number): void {
    // Apply acceleration based on input
    const acceleration = PLAYER_ACCELERATION * deltaTime;
    this.velocity.x += inputVector.x * acceleration;
    this.velocity.y += inputVector.y * acceleration;

    // Update facing direction based on horizontal movement
    if (inputVector.x > 0) {
      this.facingLeft = false;
    } else if (inputVector.x < 0) {
      this.facingLeft = true;
    }

    // Calculate max speed based on tier
    const maxSpeed = PLAYER_BASE_SPEED + (this.tier - 1) * PLAYER_TIER_SPEED_BONUS;
    
    // Clamp velocity to max speed
    this.velocity = clampMagnitude(this.velocity, maxSpeed);
  }

  /**
   * Check if player can grow to next tier
   */
  canGrowTier(): boolean {
    if (this.tier >= MAX_TIER) return false;
    const nextTier = (this.tier + 1) as 1 | 2 | 3 | 4 | 5;
    return this.fishEaten >= TIER_THRESHOLDS[nextTier];
  }

  /**
   * Grow to next tier
   */
  growTier(): boolean {
    if (!this.canGrowTier()) return false;
    
    this.tier = Math.min(this.tier + 1, MAX_TIER) as 1 | 2 | 3 | 4 | 5;
    const dimensions = TIER_DIMENSIONS[this.tier];
    this.width = dimensions.width;
    this.height = dimensions.height;
    
    return true;
  }

  /**
   * Reset player to initial state (for respawn)
   */
  respawn(): void {
    this.tier = INITIAL_TIER;
    const dimensions = TIER_DIMENSIONS[this.tier];
    this.width = dimensions.width;
    this.height = dimensions.height;
    
    this.position = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2
    };
    this.velocity = { x: 0, y: 0 };
    this.invulnerable = true;
    this.invulnerableTimer = INVULNERABILITY_DURATION;
    this.facingLeft = false;
  }

  /**
   * Update player physics and state
   */
  update(deltaTime: number, gameState: GameState): void {
    // Update invulnerability timer
    if (this.invulnerable) {
      this.invulnerableTimer -= deltaTime;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
        this.invulnerableTimer = 0;
      }
    }

    // Apply friction when no input (this will be handled by the input system)
    this.velocity.x *= PLAYER_FRICTION;
    this.velocity.y *= PLAYER_FRICTION;

    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Handle boundary conditions
    this.handleBoundaries();
  }

  /**
   * Handle screen boundary wrapping and clamping
   */
  private handleBoundaries(): void {
    // Horizontal wrap-around (left/right edges)
    if (this.position.x < -this.width / 2) {
      this.position.x = CANVAS_WIDTH + this.width / 2;
    } else if (this.position.x > CANVAS_WIDTH + this.width / 2) {
      this.position.x = -this.width / 2;
    }

    // Vertical clamping (top/bottom edges)
    if (this.position.y < this.height / 2) {
      this.position.y = this.height / 2;
    } else if (this.position.y > CANVAS_HEIGHT - this.height / 2) {
      this.position.y = CANVAS_HEIGHT - this.height / 2;
    }
  }

  /**
   * Render the player
   */
  render(ctx: CanvasRenderingContext2D, interpolation: number): void {
    // Calculate interpolated position for smooth rendering
    const renderX = this.position.x;
    const renderY = this.position.y;

    ctx.save();

    // Handle invulnerability flashing
    if (this.invulnerable) {
      const flashRate = 8; // flashes per second
      const flashPhase = (this.invulnerableTimer * flashRate) % 1;
      if (flashPhase < 0.5) {
        ctx.globalAlpha = 0.5;
      }
    }

    // Flip horizontally if facing left
    if (this.facingLeft) {
      ctx.scale(-1, 1);
      ctx.translate(-renderX * 2, 0);
    }

    // Try to draw sprite, fallback to rectangle
    const sprite = spriteLoader.getPlayerSprite(this.tier as PlayerTier);
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(
        sprite,
        renderX - this.width / 2,
        renderY - this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Fallback: Draw player as a colored rectangle
      ctx.fillStyle = this.getPlayerColor();
      ctx.fillRect(
        renderX - this.width / 2,
        renderY - this.height / 2,
        this.width,
        this.height
      );

      // Draw tier indicator (small number in corner)
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        this.tier.toString(),
        renderX,
        renderY - this.height / 2 + 8
      );
    }

    ctx.restore();
  }

  /**
   * Get player color based on tier
   */
  private getPlayerColor(): string {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0'];
    return colors[this.tier - 1] || colors[0];
  }

  /**
   * Get bounding box for collision detection
   */
  getBoundingBox(): BoundingBox {
    return {
      x: this.position.x - this.width / 2,
      y: this.position.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
}