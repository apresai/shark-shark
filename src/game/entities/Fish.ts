/**
 * Fish Entity - NPC fish that swim across the screen
 */

import { FishEntity, FishSize, Vector2D, BoundingBox, GameState } from '../types';
import {
  FISH_DIMENSIONS,
  FISH_POINTS,
  FISH_SPEEDS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../constants';
import { spriteLoader, FishSize as SpriteFishSize } from '../SpriteLoader';

export class Fish implements FishEntity {
  public readonly id: string;
  public readonly type = 'fish' as const;
  public position: Vector2D;
  public velocity: Vector2D;
  public width: number;
  public height: number;
  public active: boolean = true;

  // Fish-specific properties
  public readonly size: FishSize;
  public readonly points: number;
  private facingLeft: boolean;

  constructor(
    id: string, 
    size: FishSize, 
    position: Vector2D, 
    velocity: Vector2D
  ) {
    this.id = id;
    this.size = size;
    this.position = { ...position };
    this.velocity = { ...velocity };
    
    // Set dimensions and points based on size
    const dimensions = FISH_DIMENSIONS[size];
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.points = FISH_POINTS[size];

    // Determine facing direction based on velocity
    this.facingLeft = velocity.x < 0;
  }

  /**
   * Create a fish spawning from the left edge
   */
  static spawnFromLeft(id: string, size: FishSize, y: number, speedMultiplier: number = 1): Fish {
    const baseSpeed = FISH_SPEEDS[size] * speedMultiplier;
    return new Fish(
      id,
      size,
      { x: -FISH_DIMENSIONS[size].width / 2, y },
      { x: baseSpeed, y: 0 }
    );
  }

  /**
   * Create a fish spawning from the right edge
   */
  static spawnFromRight(id: string, size: FishSize, y: number, speedMultiplier: number = 1): Fish {
    const baseSpeed = FISH_SPEEDS[size] * speedMultiplier;
    return new Fish(
      id,
      size,
      { x: CANVAS_WIDTH + FISH_DIMENSIONS[size].width / 2, y },
      { x: -baseSpeed, y: 0 }
    );
  }

  /**
   * Update fish movement and check for despawn
   */
  update(deltaTime: number, gameState: GameState): void {
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Random Y direction adjustment (10% chance per frame at 60fps = ~6 times per second)
    if (Math.random() < 0.1 * deltaTime * 60) {
      const yAdjustment = (Math.random() - 0.5) * 20; // Small Y velocity adjustment
      this.velocity.y = Math.max(-30, Math.min(30, this.velocity.y + yAdjustment));
    }

    // Check if fish has moved off-screen and should despawn
    if (this.isOffScreen()) {
      this.active = false;
    }

    // Clamp Y position to stay within valid swimming area
    const minY = this.height / 2;
    const maxY = CANVAS_HEIGHT - this.height / 2;
    if (this.position.y < minY) {
      this.position.y = minY;
      this.velocity.y = Math.abs(this.velocity.y); // Bounce down
    } else if (this.position.y > maxY) {
      this.position.y = maxY;
      this.velocity.y = -Math.abs(this.velocity.y); // Bounce up
    }
  }

  /**
   * Check if fish is completely off-screen
   */
  private isOffScreen(): boolean {
    const margin = Math.max(this.width, this.height);
    return (
      this.position.x < -margin ||
      this.position.x > CANVAS_WIDTH + margin ||
      this.position.y < -margin ||
      this.position.y > CANVAS_HEIGHT + margin
    );
  }

  /**
   * Render the fish
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
    const sprite = spriteLoader.getFishSprite(this.size as SpriteFishSize);
    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(
        sprite,
        renderX - this.width / 2,
        renderY - this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Fallback: Draw fish as a colored rectangle
      ctx.fillStyle = this.getFishColor();
      ctx.fillRect(
        renderX - this.width / 2,
        renderY - this.height / 2,
        this.width,
        this.height
      );

      // Draw size indicator for debugging
      ctx.fillStyle = 'white';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        this.size.charAt(0).toUpperCase(),
        renderX,
        renderY + 2
      );
    }

    ctx.restore();
  }

  /**
   * Get fish color based on size
   */
  private getFishColor(): string {
    const colors: Record<FishSize, string> = {
      tiny: '#FFE082',    // Light yellow
      small: '#81C784',   // Light green
      medium: '#64B5F6',  // Light blue
      large: '#F06292',   // Light pink
      giant: '#BA68C8'    // Light purple
    };
    return colors[this.size];
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
   * Get the fish's current speed
   */
  getSpeed(): number {
    return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
  }

  /**
   * Check if this fish can be eaten by a player of given width
   */
  canBeEatenBy(playerWidth: number): boolean {
    return playerWidth > this.width;
  }
}