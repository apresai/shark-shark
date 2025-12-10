/**
 * Renderer Class
 * 
 * Handles all game rendering with interpolation for smooth visuals.
 * Draws placeholder rectangles for entities (sprites to be added later).
 * 
 * Requirements: 11.2 - Renderer SHALL use interpolation for smooth visual rendering between physics steps
 */

import { 
  Entity, 
  GameState, 
  PlayerState, 
  Vector2D,
  RenderContext,
  FishSize
} from './types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  TIER_DIMENSIONS,
  SHARK_CONFIG,
  CRAB_CONFIG,
  JELLYFISH_CONFIG,
  SEAHORSE_CONFIG
} from './constants';

export interface RendererConfig {
  /** Enable debug rendering (hitboxes, state info) */
  debug?: boolean;
  /** Background color */
  backgroundColor?: string;
  /** Ocean floor color */
  floorColor?: string;
  /** Water surface color */
  surfaceColor?: string;
}

const DEFAULT_CONFIG: Required<RendererConfig> = {
  debug: false,
  backgroundColor: '#001428',
  floorColor: '#8B4513',
  surfaceColor: '#87CEEB',
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private config: Required<RendererConfig>;
  private previousState: GameState | null = null;
  private previousEntityPositions: Map<string, Vector2D> = new Map();

  constructor(ctx: CanvasRenderingContext2D, config: RendererConfig = {}) {
    this.ctx = ctx;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set the rendering context (for context recovery)
   */
  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
  }


  /**
   * Update configuration
   */
  setConfig(config: Partial<RendererConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  /**
   * Render the complete game frame
   * @param state Current game state
   * @param interpolation Value between 0-1 for smooth rendering between physics steps
   */
  render(state: GameState, interpolation: number = 0): void {
    // Clear canvas
    this.clear();

    // Draw background elements
    this.renderBackground();

    // Create render context
    const renderContext: RenderContext = {
      ctx: this.ctx,
      interpolation,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
    };

    // Render all entities with interpolation
    this.renderEntities(state.entities, interpolation);

    // Render player
    this.renderPlayer(state.player, interpolation);

    // Store entity positions for next frame interpolation
    this.storeEntityPositions(state.entities);

    // Store state for next frame interpolation
    this.previousState = state;
  }

  /**
   * Store entity positions for interpolation in next frame
   */
  private storeEntityPositions(entities: Entity[]): void {
    this.previousEntityPositions.clear();
    for (const entity of entities) {
      if (entity.active) {
        this.previousEntityPositions.set(entity.id, { ...entity.position });
      }
    }
  }

  /**
   * Get interpolated position for an entity
   */
  getInterpolatedEntityPosition(entity: Entity, interpolation: number): Vector2D {
    const prevPos = this.previousEntityPositions.get(entity.id);
    if (prevPos) {
      return this.interpolatePosition(prevPos, entity.position, interpolation);
    }
    return entity.position;
  }

  /**
   * Render background elements (water, floor, surface)
   */
  private renderBackground(): void {
    const ctx = this.ctx;

    // Draw water gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');    // Light blue at surface
    gradient.addColorStop(0.3, '#4682B4');  // Steel blue
    gradient.addColorStop(0.7, '#1E3A5F');  // Dark blue
    gradient.addColorStop(1, '#0D1B2A');    // Very dark blue at floor
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ocean floor
    ctx.fillStyle = this.config.floorColor;
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);

    // Draw some floor texture (simple rocks)
    ctx.fillStyle = '#6B4423';
    for (let i = 0; i < 10; i++) {
      const x = (i * 90 + 20) % CANVAS_WIDTH;
      const width = 30 + (i % 3) * 10;
      ctx.fillRect(x, CANVAS_HEIGHT - 15, width, 10);
    }

    // Draw water surface line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(CANVAS_WIDTH, 10);
    ctx.stroke();
  }

  /**
   * Render all entities
   */
  private renderEntities(entities: Entity[], interpolation: number): void {
    // Sort entities by type for consistent rendering order (back to front)
    const sortedEntities = [...entities].sort((a, b) => {
      const order: Record<string, number> = {
        fish: 0,
        seahorse: 1,
        jellyfish: 2,
        crab: 3,
        shark: 4,
      };
      return (order[a.type] ?? 0) - (order[b.type] ?? 0);
    });

    // Render each entity
    for (const entity of sortedEntities) {
      if (entity.active) {
        // Entities render themselves, but we can provide fallback rendering
        entity.render(this.ctx, interpolation);
        
        // Debug: draw hitbox if enabled
        if (this.config.debug) {
          const box = entity.getBoundingBox();
          this.drawDebugHitbox(box.x, box.y, box.width, box.height, this.getEntityDebugColor(entity.type));
        }
      }
    }
  }

  /**
   * Get debug color for entity type
   */
  private getEntityDebugColor(type: string): string {
    const colors: Record<string, string> = {
      fish: 'yellow',
      shark: 'red',
      crab: 'orange',
      jellyfish: 'purple',
      seahorse: 'cyan',
    };
    return colors[type] ?? 'white';
  }

  /**
   * Render a fish entity (fallback/utility method)
   */
  renderFish(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    size: FishSize,
    facingLeft: boolean = false
  ): void {
    const ctx = this.ctx;
    ctx.save();

    if (facingLeft) {
      ctx.scale(-1, 1);
      ctx.translate(-x * 2, 0);
    }

    // Draw fish body
    ctx.fillStyle = this.getFishColor(size);
    ctx.fillRect(x - width / 2, y - height / 2, width, height);

    // Draw size indicator
    ctx.fillStyle = 'white';
    ctx.font = '8px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(size.charAt(0).toUpperCase(), x, y + 2);

    ctx.restore();
  }

  /**
   * Get fish color based on size
   */
  private getFishColor(size: FishSize): string {
    const colors: Record<FishSize, string> = {
      tiny: '#FFE082',
      small: '#81C784',
      medium: '#64B5F6',
      large: '#F06292',
      giant: '#BA68C8',
    };
    return colors[size];
  }

  /**
   * Render a shark entity (fallback/utility method)
   */
  renderShark(
    x: number, 
    y: number, 
    width: number, 
    height: number,
    facingLeft: boolean = false,
    state: string = 'patrol'
  ): void {
    const ctx = this.ctx;
    ctx.save();

    if (facingLeft) {
      ctx.scale(-1, 1);
      ctx.translate(-x * 2, 0);
    }

    // Draw shark body (dark gray)
    ctx.fillStyle = '#424242';
    ctx.fillRect(x - width / 2, y - height / 2, width, height);

    // Draw tail section (lighter gray)
    const tailWidth = width * SHARK_CONFIG.tailRatio;
    ctx.fillStyle = '#757575';
    ctx.fillRect(
      facingLeft ? x + width / 2 - tailWidth : x - width / 2,
      y - height / 2,
      tailWidth,
      height
    );

    // Draw state indicator
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(state.charAt(0).toUpperCase(), x, y - height / 2 + 12);

    ctx.restore();
  }

  /**
   * Render a crab entity (fallback/utility method)
   */
  renderCrab(
    x: number, 
    y: number, 
    width: number, 
    height: number,
    facingLeft: boolean = false
  ): void {
    const ctx = this.ctx;
    ctx.save();

    if (facingLeft) {
      ctx.scale(-1, 1);
      ctx.translate(-x * 2, 0);
    }

    // Draw crab body (reddish-brown)
    ctx.fillStyle = '#8D4004';
    ctx.fillRect(x - width / 2, y - height / 2, width, height);

    // Draw claws
    ctx.fillStyle = '#5D2C02';
    const clawSize = 4;
    ctx.fillRect(x - width / 2 - clawSize, y - height / 4, clawSize, height / 2);
    ctx.fillRect(x + width / 2, y - height / 4, clawSize, height / 2);

    // Draw eyes
    ctx.fillStyle = 'white';
    const eyeSize = 2;
    ctx.fillRect(x - width / 4, y - height / 3, eyeSize, eyeSize);
    ctx.fillRect(x + width / 4 - eyeSize, y - height / 3, eyeSize, eyeSize);

    ctx.restore();
  }

  /**
   * Render a jellyfish entity (fallback/utility method)
   */
  renderJellyfish(x: number, y: number, width: number, height: number): void {
    const ctx = this.ctx;
    ctx.save();

    // Draw jellyfish bell (translucent purple)
    ctx.fillStyle = 'rgba(147, 112, 219, 0.8)';
    ctx.beginPath();
    ctx.ellipse(x, y - height / 4, width / 2, height / 3, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Draw tentacles
    ctx.strokeStyle = 'rgba(102, 51, 153, 0.9)';
    ctx.lineWidth = 2;
    
    const tentacleCount = 4;
    for (let i = 0; i < tentacleCount; i++) {
      const angle = (i / tentacleCount) * Math.PI - Math.PI / 2;
      const startX = x + Math.cos(angle) * (width / 3);
      const startY = y;
      const endX = startX + Math.cos(angle + Math.PI / 2) * (height / 2);
      const endY = y + height / 2;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Render a seahorse entity (fallback/utility method)
   */
  renderSeahorse(x: number, y: number, width: number, height: number): void {
    const ctx = this.ctx;
    ctx.save();

    // Draw seahorse body (golden/yellow)
    ctx.fillStyle = '#FFD700';
    
    // Draw curved body shape
    ctx.beginPath();
    ctx.ellipse(x, y, width / 2, height / 2, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Draw head (smaller circle at top)
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(x, y - height / 3, width / 3, 0, 2 * Math.PI);
    ctx.fill();

    // Draw curled tail
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y + height / 3, width / 4, 0, Math.PI * 1.5);
    ctx.stroke();

    // Draw eye
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x + width / 8, y - height / 3, 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }


  /**
   * Render the player with interpolation
   */
  private renderPlayer(player: PlayerState, interpolation: number): void {
    const ctx = this.ctx;
    
    // Calculate interpolated position
    let renderX = player.position.x;
    let renderY = player.position.y;

    // If we have previous state, interpolate position
    if (this.previousState) {
      const prevPlayer = this.previousState.player;
      renderX = this.lerp(prevPlayer.position.x, player.position.x, interpolation);
      renderY = this.lerp(prevPlayer.position.y, player.position.y, interpolation);
    }

    ctx.save();

    // Handle invulnerability flashing
    if (player.invulnerable) {
      const flashRate = 8; // flashes per second
      const flashPhase = (player.invulnerableTimer * flashRate) % 1;
      if (flashPhase < 0.5) {
        ctx.globalAlpha = 0.5;
      }
    }

    // Flip horizontally if facing left
    if (player.facingLeft) {
      ctx.scale(-1, 1);
      ctx.translate(-renderX * 2, 0);
    }

    // Draw player as a colored rectangle (placeholder for sprite)
    ctx.fillStyle = this.getPlayerColor(player.tier);
    ctx.fillRect(
      renderX - player.width / 2,
      renderY - player.height / 2,
      player.width,
      player.height
    );

    // Draw fish shape outline
    this.drawFishShape(renderX, renderY, player.width, player.height);

    // Draw tier indicator
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      player.tier.toString(),
      renderX,
      renderY
    );

    ctx.restore();

    // Debug: draw hitbox
    if (this.config.debug) {
      this.drawDebugHitbox(
        renderX - player.width / 2,
        renderY - player.height / 2,
        player.width,
        player.height,
        'lime'
      );
    }
  }

  /**
   * Draw a simple fish shape outline
   */
  private drawFishShape(x: number, y: number, width: number, height: number): void {
    const ctx = this.ctx;
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    
    // Draw tail
    ctx.beginPath();
    ctx.moveTo(x - width / 2, y);
    ctx.lineTo(x - width / 2 - width / 4, y - height / 3);
    ctx.lineTo(x - width / 2 - width / 4, y + height / 3);
    ctx.closePath();
    ctx.stroke();
    
    // Draw eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x + width / 4, y - height / 6, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Get player color based on tier
   */
  private getPlayerColor(tier: number): string {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0'];
    return colors[tier - 1] || colors[0];
  }

  /**
   * Draw debug hitbox
   */
  private drawDebugHitbox(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    color: string
  ): void {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  }

  /**
   * Linear interpolation helper
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Interpolate between two positions
   */
  interpolatePosition(prev: Vector2D, current: Vector2D, t: number): Vector2D {
    return {
      x: this.lerp(prev.x, current.x, t),
      y: this.lerp(prev.y, current.y, t),
    };
  }
}

export default Renderer;
