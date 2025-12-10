/**
 * Shark Entity - The apex predator with patrol, dive, and return behaviors
 */

import { SharkEntity, SharkState, Vector2D, BoundingBox, GameState } from '../types';
import { 
  SHARK_CONFIG,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../constants';

export class Shark implements SharkEntity {
  public readonly id: string;
  public readonly type = 'shark' as const;
  public position: Vector2D;
  public velocity: Vector2D;
  public width: number;
  public height: number;
  public active: boolean = true;

  // Shark-specific properties
  public state: SharkState;
  public diveTimer: number;
  public targetY: number;
  private facingLeft: boolean;
  private patrolDirection: number; // 1 for right, -1 for left

  constructor(id: string, position?: Vector2D) {
    this.id = id;
    this.width = SHARK_CONFIG.width;
    this.height = SHARK_CONFIG.height;
    
    // Initialize position - default to upper left area for patrol
    this.position = position ?? {
      x: CANVAS_WIDTH * 0.2,
      y: CANVAS_HEIGHT * 0.3
    };
    
    // Initialize in patrol state
    this.state = 'patrol';
    this.diveTimer = 0;
    this.targetY = 0;
    this.facingLeft = false;
    this.patrolDirection = 1; // Start moving right
    
    // Set initial velocity for patrol
    this.velocity = {
      x: SHARK_CONFIG.baseSpeed * this.patrolDirection,
      y: 0
    };
  }

  /**
   * Update shark behavior based on current state
   */
  update(deltaTime: number, gameState: GameState): void {
    const player = gameState.player;
    
    switch (this.state) {
      case 'patrol':
        this.updatePatrol(deltaTime, player);
        break;
      case 'dive':
        this.updateDive(deltaTime, player);
        break;
      case 'return':
        this.updateReturn(deltaTime);
        break;
    }

    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Update facing direction based on horizontal movement
    if (this.velocity.x > 0) {
      this.facingLeft = false;
    } else if (this.velocity.x < 0) {
      this.facingLeft = true;
    }

    // Keep shark within screen bounds horizontally
    this.handleHorizontalBounds();
  }

  /**
   * Update patrol behavior - move horizontally in upper 60% of screen
   */
  private updatePatrol(deltaTime: number, player: { position: Vector2D }): void {
    // Maintain horizontal patrol movement
    this.velocity.x = SHARK_CONFIG.baseSpeed * this.patrolDirection;
    this.velocity.y = 0;

    // Keep within patrol Y range (upper 60% of screen)
    const maxPatrolY = CANVAS_HEIGHT * SHARK_CONFIG.patrolYRange;
    if (this.position.y > maxPatrolY) {
      this.position.y = maxPatrolY;
    }

    // Check if player is directly below shark for dive trigger
    const horizontalDistance = Math.abs(this.position.x - player.position.x);
    const isPlayerBelow = player.position.y > this.position.y + this.height / 2;
    const isPlayerAligned = horizontalDistance < this.width / 2;

    if (isPlayerBelow && isPlayerAligned) {
      this.diveTimer += deltaTime;
      
      // Trigger dive if player has been below for more than trigger time
      if (this.diveTimer >= SHARK_CONFIG.diveTriggerTime) {
        this.startDive(player.position.y);
      }
    } else {
      // Reset dive timer if player is not in position
      this.diveTimer = 0;
    }

    // Reverse direction at screen edges
    if (this.position.x <= this.width / 2) {
      this.patrolDirection = 1; // Move right
    } else if (this.position.x >= CANVAS_WIDTH - this.width / 2) {
      this.patrolDirection = -1; // Move left
    }
  }

  /**
   * Update dive behavior - move toward target Y position
   */
  private updateDive(deltaTime: number, player: { position: Vector2D }): void {
    // Move vertically toward target Y
    this.velocity.x = 0;
    this.velocity.y = SHARK_CONFIG.diveSpeed;

    // Check if reached target Y or ocean floor
    const floorY = CANVAS_HEIGHT - this.height / 2;
    if (this.position.y >= this.targetY || this.position.y >= floorY) {
      this.startReturn();
    }
  }

  /**
   * Update return behavior - move back to patrol area
   */
  private updateReturn(deltaTime: number): void {
    // Move upward and toward center of screen
    const targetX = CANVAS_WIDTH / 2;
    const targetY = CANVAS_HEIGHT * 0.3; // Return to upper area

    const dx = targetX - this.position.x;
    const dy = targetY - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 10) {
      // Normalize direction and apply return speed
      this.velocity.x = (dx / distance) * SHARK_CONFIG.returnSpeed;
      this.velocity.y = (dy / distance) * SHARK_CONFIG.returnSpeed;
    } else {
      // Reached patrol area, switch back to patrol
      this.state = 'patrol';
      this.diveTimer = 0;
      this.velocity.x = SHARK_CONFIG.baseSpeed * this.patrolDirection;
      this.velocity.y = 0;
    }
  }

  /**
   * Start dive behavior toward player
   */
  private startDive(playerY: number): void {
    this.state = 'dive';
    this.targetY = playerY;
    this.diveTimer = 0;
  }

  /**
   * Start return behavior back to patrol
   */
  private startReturn(): void {
    this.state = 'return';
  }

  /**
   * Handle horizontal screen boundaries
   */
  private handleHorizontalBounds(): void {
    // Keep shark within screen bounds
    if (this.position.x < this.width / 2) {
      this.position.x = this.width / 2;
    } else if (this.position.x > CANVAS_WIDTH - this.width / 2) {
      this.position.x = CANVAS_WIDTH - this.width / 2;
    }
  }

  /**
   * Get the body hitbox (90% from front)
   */
  getBodyHitbox(): BoundingBox {
    const bodyWidth = this.width * SHARK_CONFIG.bodyRatio;
    const bodyX = this.facingLeft 
      ? this.position.x - this.width / 2  // Body at front when facing left
      : this.position.x + this.width / 2 - bodyWidth; // Body at front when facing right

    return {
      x: bodyX,
      y: this.position.y - this.height / 2,
      width: bodyWidth,
      height: this.height
    };
  }

  /**
   * Get the tail hitbox (10% from back)
   */
  getTailHitbox(): BoundingBox {
    const tailWidth = this.width * SHARK_CONFIG.tailRatio;
    const tailX = this.facingLeft
      ? this.position.x + this.width / 2 - tailWidth  // Tail at back when facing left
      : this.position.x - this.width / 2; // Tail at back when facing right

    return {
      x: tailX,
      y: this.position.y - this.height / 2,
      width: tailWidth,
      height: this.height
    };
  }

  /**
   * Render the shark
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

    // Draw shark body (dark gray)
    ctx.fillStyle = '#424242';
    ctx.fillRect(
      renderX - this.width / 2,
      renderY - this.height / 2,
      this.width,
      this.height
    );

    // Draw tail section (lighter gray for visual distinction)
    const tailHitbox = this.getTailHitbox();
    ctx.fillStyle = '#757575';
    ctx.fillRect(
      this.facingLeft ? renderX + this.width / 2 - tailHitbox.width : renderX - this.width / 2,
      renderY - this.height / 2,
      tailHitbox.width,
      this.height
    );

    // Draw state indicator for debugging
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      this.state.charAt(0).toUpperCase(),
      renderX,
      renderY - this.height / 2 + 12
    );

    // Draw dive timer if in patrol and tracking player
    if (this.state === 'patrol' && this.diveTimer > 0) {
      ctx.fillStyle = 'red';
      ctx.font = '8px Arial';
      ctx.fillText(
        `${this.diveTimer.toFixed(1)}s`,
        renderX,
        renderY + this.height / 2 - 4
      );
    }

    ctx.restore();
  }

  /**
   * Get bounding box for collision detection (full shark)
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
   * Check if a point is within the patrol Y range
   */
  isInPatrolRange(y: number): boolean {
    return y <= CANVAS_HEIGHT * SHARK_CONFIG.patrolYRange;
  }

  /**
   * Get current speed
   */
  getSpeed(): number {
    return Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
  }
}