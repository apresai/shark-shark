/**
 * Jellyfish Entity - Floating hazard that drifts upward
 */

import { JellyfishEntity, Vector2D, BoundingBox, GameState } from '../types';
import {
  JELLYFISH_CONFIG,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../constants';
import { spriteLoader } from '../SpriteLoader';

export class Jellyfish implements JellyfishEntity {
  public readonly id: string;
  public readonly type = 'jellyfish' as const;
  public position: Vector2D;
  public velocity: Vector2D;
  public width: number;
  public height: number;
  public active: boolean = true;

  constructor(id: string, position?: Vector2D) {
    this.id = id;
    this.width = JELLYFISH_CONFIG.width;
    this.height = JELLYFISH_CONFIG.height;
    
    // Initialize position - default to floor level at random X
    this.position = position ?? {
      x: Math.random() * CANVAS_WIDTH,
      y: CANVAS_HEIGHT - this.height / 2
    };
    
    // Always drift upward
    this.velocity = {
      x: 0,
      y: -JELLYFISH_CONFIG.speed // Negative Y is upward
    };
  }

  /**
   * Update jellyfish movement and handle surface reset
   */
  update(deltaTime: number, gameState: GameState): void {
    // Update position based on velocity
    this.position.y += this.velocity.y * deltaTime;
    
    // Check if reached surface and reset to floor
    if (this.position.y <= this.height / 2) {
      // Reset to ocean floor at random X position
      this.position.x = Math.random() * CANVAS_WIDTH;
      this.position.y = CANVAS_HEIGHT - this.height / 2;
    }
    
    // Keep within horizontal bounds
    if (this.position.x < this.width / 2) {
      this.position.x = this.width / 2;
    } else if (this.position.x > CANVAS_WIDTH - this.width / 2) {
      this.position.x = CANVAS_WIDTH - this.width / 2;
    }
  }
  /**
   * Render the jellyfish
   */
  render(ctx: CanvasRenderingContext2D, interpolation: number): void {
    const renderX = this.position.x;
    const renderY = this.position.y;

    ctx.save();

    // Try to draw sprite, fallback to shapes
    const sprite = spriteLoader.getHazardSprite('jellyfish');
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(
        sprite,
        renderX - this.width / 2,
        renderY - this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Fallback: Draw jellyfish bell (translucent purple)
      ctx.fillStyle = 'rgba(147, 112, 219, 0.8)';
      ctx.beginPath();
      ctx.ellipse(
        renderX,
        renderY - this.height / 4,
        this.width / 2,
        this.height / 3,
        0,
        0,
        2 * Math.PI
      );
      ctx.fill();

      // Draw jellyfish tentacles (darker purple lines)
      ctx.strokeStyle = 'rgba(102, 51, 153, 0.9)';
      ctx.lineWidth = 2;

      const tentacleCount = 4;
      for (let i = 0; i < tentacleCount; i++) {
        const angle = (i / tentacleCount) * Math.PI - Math.PI / 2;
        const startX = renderX + Math.cos(angle) * (this.width / 3);
        const startY = renderY;
        const endX = startX + Math.cos(angle + Math.PI / 2) * (this.height / 2);
        const endY = renderY + this.height / 2;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
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
    return Math.abs(this.velocity.y);
  }

  /**
   * Check if jellyfish is at surface
   */
  isAtSurface(): boolean {
    return this.position.y <= this.height / 2;
  }

  /**
   * Check if jellyfish is at floor
   */
  isAtFloor(): boolean {
    return this.position.y >= CANVAS_HEIGHT - this.height / 2;
  }
}