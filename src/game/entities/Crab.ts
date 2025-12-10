/**
 * Crab Entity - Floor-dwelling hazard that patrols left and right
 */

import { CrabEntity, Vector2D, BoundingBox, GameState } from '../types';
import {
  CRAB_CONFIG,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../constants';
import { spriteLoader } from '../SpriteLoader';

export class Crab implements CrabEntity {
  public readonly id: string;
  public readonly type = 'crab' as const;
  public position: Vector2D;
  public velocity: Vector2D;
  public width: number;
  public height: number;
  public active: boolean = true;

  private facingLeft: boolean;

  constructor(id: string, position?: Vector2D) {
    this.id = id;
    this.width = CRAB_CONFIG.width;
    this.height = CRAB_CONFIG.height;
    
    // Initialize position - default to floor level at random X
    this.position = position ?? {
      x: Math.random() * CANVAS_WIDTH,
      y: CRAB_CONFIG.floorY
    };
    
    // Start moving in random direction
    const direction = Math.random() < 0.5 ? -1 : 1;
    this.velocity = {
      x: CRAB_CONFIG.speed * direction,
      y: 0
    };
    
    this.facingLeft = direction < 0;
  }

  /**
   * Update crab movement and handle edge reversal
   */
  update(deltaTime: number, gameState: GameState): void {
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    
    // Keep at floor level
    this.position.y = CRAB_CONFIG.floorY;
    
    // Check for screen edge collision and reverse direction
    if (this.position.x <= this.width / 2) {
      // Hit left edge - move right
      this.position.x = this.width / 2;
      this.velocity.x = CRAB_CONFIG.speed;
      this.facingLeft = false;
    } else if (this.position.x >= CANVAS_WIDTH - this.width / 2) {
      // Hit right edge - move left
      this.position.x = CANVAS_WIDTH - this.width / 2;
      this.velocity.x = -CRAB_CONFIG.speed;
      this.facingLeft = true;
    }
  }

  /**
   * Render the crab
   */
  render(ctx: CanvasRenderingContext2D, interpolation: number): void {
    const renderX = this.position.x;
    const renderY = this.position.y;

    ctx.save();

    // Flip horizontally if facing left
    if (this.facingLeft) {
      ctx.scale(-1, 1);
      ctx.translate(-renderX * 2, 0);
    }

    // Try to draw sprite, fallback to rectangle
    const sprite = spriteLoader.getHazardSprite('crab');
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(
        sprite,
        renderX - this.width / 2,
        renderY - this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Fallback: Draw crab body (reddish-brown)
      ctx.fillStyle = '#8D4004';
      ctx.fillRect(
        renderX - this.width / 2,
        renderY - this.height / 2,
        this.width,
        this.height
      );

      // Draw crab claws (darker red)
      ctx.fillStyle = '#5D2C02';
      const clawSize = 4;
      // Left claw
      ctx.fillRect(
        renderX - this.width / 2 - clawSize,
        renderY - this.height / 4,
        clawSize,
        this.height / 2
      );
      // Right claw
      ctx.fillRect(
        renderX + this.width / 2,
        renderY - this.height / 4,
        clawSize,
        this.height / 2
      );

      // Draw eyes (white dots)
      ctx.fillStyle = 'white';
      const eyeSize = 2;
      ctx.fillRect(
        renderX - this.width / 4,
        renderY - this.height / 3,
        eyeSize,
        eyeSize
      );
      ctx.fillRect(
        renderX + this.width / 4 - eyeSize,
        renderY - this.height / 3,
        eyeSize,
        eyeSize
      );
    }

    ctx.restore();
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

  /**
   * Get current speed
   */
  getSpeed(): number {
    return Math.abs(this.velocity.x);
  }

  /**
   * Check if crab is at floor level
   */
  isAtFloor(): boolean {
    return Math.abs(this.position.y - CRAB_CONFIG.floorY) < 1;
  }
}