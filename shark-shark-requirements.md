# Shark Shark — Game Design & Technical Requirements

**Version:** 1.0  
**Last Updated:** December 2024  
**Platform:** Web Browser (Next.js 16)  
**Deployment:** AWS S3 + CloudFront  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Game Overview](#2-game-overview)
3. [Core Game Rules](#3-core-game-rules)
4. [Entity Specifications](#4-entity-specifications)
5. [Game State Machine](#5-game-state-machine)
6. [Scoring System](#6-scoring-system)
7. [Difficulty Progression](#7-difficulty-progression)
8. [Technical Architecture](#8-technical-architecture)
9. [Project Structure](#9-project-structure)
10. [Core Interfaces & Types](#10-core-interfaces--types)
11. [System Implementations](#11-system-implementations)
12. [AWS Infrastructure](#12-aws-infrastructure)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [Configuration Files](#14-configuration-files)
15. [Requirements Checklist](#15-requirements-checklist)
16. [Development Roadmap](#16-development-roadmap)
17. [Appendix](#17-appendix)

---

## 1. Executive Summary

**Shark Shark** is a browser-based arcade survival game inspired by the classic 1982 Intellivision title. Players control a small fish in an ocean environment, consuming smaller fish to grow while avoiding larger predators and the ever-present shark.

### Key Objectives

- Faithful recreation of classic gameplay mechanics
- Modern web technologies (Next.js 16, TypeScript, Canvas API)
- Serverless AWS deployment for global scalability
- Mobile-responsive with touch controls
- High score persistence

### Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.x |
| Rendering | HTML5 Canvas 2D |
| State | React hooks + useReducer |
| Audio | Web Audio API |
| Hosting | AWS S3 (Static) |
| CDN | AWS CloudFront |
| DNS | AWS Route 53 (optional) |
| SSL | AWS Certificate Manager |
| IaC | AWS CDK v2 |
| CI/CD | GitHub Actions |

---

## 2. Game Overview

### Concept

The player begins as the smallest fish in the ocean. By eating fish smaller than themselves, they grow through five size tiers. The goal is to survive as long as possible, achieve maximum size, and accumulate the highest score.

### Core Loop

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   SPAWN → HUNT → EAT → GROW → SURVIVE → REPEAT         │
│                    ↓                                    │
│              ENCOUNTER THREAT                           │
│                    ↓                                    │
│         ┌─────────┴─────────┐                          │
│         ↓                   ↓                          │
│     ESCAPE              GET EATEN                      │
│         ↓                   ↓                          │
│     CONTINUE            LOSE LIFE                      │
│                             ↓                          │
│                   ┌─────────┴─────────┐                │
│                   ↓                   ↓                │
│              RESPAWN            GAME OVER              │
│                   ↓              (no lives)            │
│              CONTINUE                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Win/Loss Conditions

| Condition | Type | Description |
|-----------|------|-------------|
| All lives lost | **LOSS** | Game ends, final score recorded |
| No win state | — | Endless survival; goal is high score |
| Implicit victory | **WIN** | Reaching Tier 5 and surviving |

---

## 3. Core Game Rules

### 3.1 Player Mechanics

| Rule | Specification |
|------|---------------|
| **Starting Size** | Tier 1 (16×12 pixels) |
| **Movement** | 8-directional, velocity-based with momentum |
| **Speed** | Base 150 px/s, scales slightly with tier |
| **Eating** | Collision with fish where `target.width < player.width` |
| **Death** | Collision with fish where `target.width >= player.width` |
| **Lives** | Start with 3; gain extra life at score thresholds |
| **Respawn** | Returns to Tier 1, brief invulnerability (2 seconds) |

### 3.2 Size Tier System

Growth is determined by cumulative fish eaten, not current session count.

| Tier | Name | Dimensions | Fish to Reach | Cumulative Total |
|------|------|------------|---------------|------------------|
| 1 | Tiny | 16×12 px | — | 0 |
| 2 | Small | 24×18 px | 5 | 5 |
| 3 | Medium | 32×24 px | 10 | 15 |
| 4 | Large | 48×36 px | 15 | 30 |
| 5 | Giant | 64×48 px | 20 | 50 |

### 3.3 Movement Physics

```typescript
// Movement constants
const PLAYER_ACCELERATION = 800;      // px/s²
const PLAYER_MAX_SPEED = 200;         // px/s (tier 1)
const PLAYER_FRICTION = 0.92;         // velocity multiplier per frame
const TIER_SPEED_BONUS = 10;          // additional px/s per tier

// Per-frame update
velocity.x += input.x * PLAYER_ACCELERATION * deltaTime;
velocity.y += input.y * PLAYER_ACCELERATION * deltaTime;
velocity.x *= PLAYER_FRICTION;
velocity.y *= PLAYER_FRICTION;
velocity = clampMagnitude(velocity, PLAYER_MAX_SPEED + (tier * TIER_SPEED_BONUS));
position.x += velocity.x * deltaTime;
position.y += velocity.y * deltaTime;
```

### 3.4 Boundary Rules

| Boundary | Behavior |
|----------|----------|
| Left/Right edges | Player wraps to opposite side |
| Top edge | Player blocked (water surface) |
| Bottom edge | Player blocked (ocean floor) |

---

## 4. Entity Specifications

### 4.1 Entity Hierarchy

```
Entity (base)
├── Player
├── Fish
│   ├── TinyFish
│   ├── SmallFish
│   ├── MediumFish
│   ├── LargeFish
│   └── GiantFish
├── Shark
├── Crab
├── Jellyfish
└── Seahorse
```

### 4.2 Fish Entities

Fish spawn from screen edges and swim horizontally until they exit the opposite side.

| Type | Dimensions | Speed | Points (Base) | Spawn Weight |
|------|------------|-------|---------------|--------------|
| Tiny | 12×9 px | 60 px/s | 10 | 30% |
| Small | 20×15 px | 80 px/s | 25 | 30% |
| Medium | 28×21 px | 100 px/s | 50 | 20% |
| Large | 40×30 px | 120 px/s | 100 | 15% |
| Giant | 56×42 px | 140 px/s | 200 | 5% |

**Behavior:**
- Spawn at random Y position on left or right edge
- Move in straight line until off-screen
- 10% chance to change Y direction slightly mid-screen
- Removed from entity pool when fully off-screen

### 4.3 The Shark

The shark is the apex predator and primary threat.

| Property | Value |
|----------|-------|
| Dimensions | 96×48 px |
| Base Speed | 120 px/s |
| Max Speed | 200 px/s (at high difficulty) |
| Patrol Y Range | Upper 60% of screen |
| Dive Trigger | Player directly below for >1 second |

**Hitbox Zones:**

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ████████████████████████████████████████████░░░░░░░░░  │
│  █              LETHAL ZONE (90%)            █  TAIL   █  │
│  █         Contact = Instant Death           █  (10%)  █  │
│  ████████████████████████████████████████████░░░░░░░░░  │
│                                               ↑          │
│                                          Bite for        │
│                                          500 points      │
└──────────────────────────────────────────────────────────┘
```

**Behavior State Machine:**

```
┌─────────────┐
│   PATROL    │ ←─────────────────────────┐
│ (horizontal)│                           │
└──────┬──────┘                           │
       │                                  │
       │ Player below for >1s             │
       ▼                                  │
┌─────────────┐                           │
│    DIVE     │                           │
│ (vertical)  │                           │
└──────┬──────┘                           │
       │                                  │
       │ Reached target Y or hit floor    │
       ▼                                  │
┌─────────────┐                           │
│   RETURN    │ ──────────────────────────┘
│ (to patrol) │
└─────────────┘
```

### 4.4 Crab

| Property | Value |
|----------|-------|
| Dimensions | 24×16 px |
| Speed | 40 px/s |
| Position | Ocean floor only |
| Behavior | Patrol left-right, reverse at edges |
| Threat | Always lethal on contact |
| Spawn Condition | Player reaches Tier 2 |

### 4.5 Jellyfish

| Property | Value |
|----------|-------|
| Dimensions | 20×28 px |
| Speed | 30 px/s vertical |
| Behavior | Drift upward, despawn at surface, respawn at bottom |
| Threat | Always lethal on contact |
| Spawn Condition | Elapsed time > 60 seconds |
| Max Active | 3 |

### 4.6 Seahorse (Bonus)

| Property | Value |
|----------|-------|
| Dimensions | 16×24 px |
| Speed | 50 px/s |
| Behavior | Appears briefly, moves erratically |
| Reward | 200 points + chance for extra life |
| Spawn Rate | Every 45-90 seconds |
| Duration | 8 seconds on screen |

---

## 5. Game State Machine

### 5.1 State Diagram

```
                              ┌─────────────────┐
                              │                 │
                              │   INITIALIZING  │
                              │                 │
                              └────────┬────────┘
                                       │
                                       │ Assets loaded
                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────┐         Start          ┌─────────────┐        │
│  │             │ ─────────────────────► │             │        │
│  │    TITLE    │                        │   PLAYING   │ ◄──┐   │
│  │             │ ◄───────────────────── │             │    │   │
│  └─────────────┘       Game Over +      └──────┬──────┘    │   │
│        ▲               Restart                 │           │   │
│        │                                       │           │   │
│        │                              Player dies          │   │
│        │                                       │           │   │
│        │                                       ▼           │   │
│        │                               ┌─────────────┐     │   │
│        │                               │             │     │   │
│        │                               │    DYING    │     │   │
│        │                               │ (animation) │     │   │
│        │                               └──────┬──────┘     │   │
│        │                                      │            │   │
│        │                         ┌────────────┴────────┐   │   │
│        │                         │                     │   │   │
│        │                   Lives > 0              Lives = 0│   │
│        │                         │                     │   │   │
│        │                         ▼                     ▼   │   │
│        │                  ┌─────────────┐      ┌───────────┴─┐ │
│        │                  │             │      │             │ │
│        │                  │   RESPAWN   │      │  GAME OVER  │ │
│        │                  │             │      │             │ │
│        │                  └──────┬──────┘      └──────┬──────┘ │
│        │                         │                    │        │
│        │                         │ Invuln expires     │        │
│        │                         └────────────────────┼────────┘
│        │                                              │
│        └──────────────────────────────────────────────┘
│                              Restart                           │
│                                                                 │
│  ┌─────────────┐                                               │
│  │             │                                               │
│  │   PAUSED    │ ◄──────── ESC / Focus Lost ────────┐         │
│  │             │ ─────────── ESC / Resume ──────────┼─────►   │
│  └─────────────┘                                    │         │
│                                                 PLAYING        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 State Definitions

```typescript
type GameStatus = 
  | 'initializing'  // Loading assets
  | 'title'         // Main menu
  | 'playing'       // Active gameplay
  | 'paused'        // Game paused
  | 'dying'         // Death animation (1.5s)
  | 'respawn'       // Invulnerability period (2s)
  | 'gameover';     // Final screen

interface GameStateTransition {
  from: GameStatus;
  to: GameStatus;
  trigger: string;
  action?: () => void;
}

const STATE_TRANSITIONS: GameStateTransition[] = [
  { from: 'initializing', to: 'title', trigger: 'ASSETS_LOADED' },
  { from: 'title', to: 'playing', trigger: 'START_GAME' },
  { from: 'playing', to: 'paused', trigger: 'PAUSE' },
  { from: 'paused', to: 'playing', trigger: 'RESUME' },
  { from: 'playing', to: 'dying', trigger: 'PLAYER_DEATH' },
  { from: 'dying', to: 'respawn', trigger: 'DEATH_ANIM_COMPLETE', action: checkLives },
  { from: 'dying', to: 'gameover', trigger: 'NO_LIVES_REMAINING' },
  { from: 'respawn', to: 'playing', trigger: 'INVULN_EXPIRED' },
  { from: 'gameover', to: 'title', trigger: 'RESTART' },
];
```

---

## 6. Scoring System

### 6.1 Point Values

| Action | Base Points | Formula |
|--------|-------------|---------|
| Eat Tiny Fish | 10 | `10 × playerTier` |
| Eat Small Fish | 25 | `25 × playerTier` |
| Eat Medium Fish | 50 | `50 × playerTier` |
| Eat Large Fish | 100 | `100 × playerTier` |
| Eat Giant Fish | 200 | `200 × playerTier` |
| Bite Shark Tail | 500 | Flat (no multiplier) |
| Collect Seahorse | 200 | Flat + 25% chance extra life |
| Survival Bonus | 1/sec | Only at Tier 5 |

### 6.2 Score Multipliers

```typescript
function calculateScore(fishType: FishType, playerTier: number): number {
  const basePoints: Record<FishType, number> = {
    tiny: 10,
    small: 25,
    medium: 50,
    large: 100,
    giant: 200,
  };
  
  return basePoints[fishType] * playerTier;
}
```

### 6.3 Extra Life Thresholds

| Threshold | Lives Awarded |
|-----------|---------------|
| 10,000 points | +1 life |
| 30,000 points | +1 life |
| 60,000 points | +1 life |
| 100,000 points | +1 life |
| Every 50,000 after | +1 life |

### 6.4 High Score Persistence

```typescript
// localStorage key: 'sharkshark_highscore'
interface HighScoreEntry {
  score: number;
  tier: number;
  fishEaten: number;
  timestamp: string;
}

// Top 10 scores stored
interface HighScoreTable {
  entries: HighScoreEntry[];
}
```

---

## 7. Difficulty Progression

### 7.1 Difficulty Curve

Difficulty increases based on two factors:
1. **Elapsed Time** — Global difficulty ramp
2. **Player Tier** — Contextual challenge adjustment

```typescript
interface DifficultyConfig {
  fishSpawnRate: number;        // Fish per second
  fishSpeedMultiplier: number;  // Applied to base speeds
  sharkEnabled: boolean;
  sharkSpeed: number;
  sharkDiveFrequency: number;   // Seconds between dive attempts
  crabEnabled: boolean;
  jellyfishEnabled: boolean;
  jellyfishCount: number;
  largeFishRatio: number;       // Percentage of fish >= player size
}

function calculateDifficulty(elapsedTime: number, playerTier: number): DifficultyConfig {
  const timeMinutes = elapsedTime / 60;
  const baseDifficulty = Math.min(timeMinutes / 5, 1); // Caps at 5 minutes
  
  return {
    fishSpawnRate: 0.8 + (baseDifficulty * 1.2),
    fishSpeedMultiplier: 1 + (baseDifficulty * 0.5),
    sharkEnabled: elapsedTime > 20,
    sharkSpeed: 120 + (baseDifficulty * 80),
    sharkDiveFrequency: Math.max(8 - (baseDifficulty * 4), 3),
    crabEnabled: playerTier >= 2,
    jellyfishEnabled: elapsedTime > 60,
    jellyfishCount: Math.min(Math.floor(timeMinutes), 3),
    largeFishRatio: 0.2 + (baseDifficulty * 0.3) + (playerTier * 0.05),
  };
}
```

### 7.2 Spawn Distribution by Phase

| Phase | Time Range | Fish Distribution | Hazards |
|-------|------------|-------------------|---------|
| Early | 0-30s | 60% smaller, 40% equal/larger | None |
| Mid | 30-90s | 50% smaller, 50% equal/larger | Shark patrols |
| Late | 90-180s | 40% smaller, 60% equal/larger | Shark + Crab |
| Endgame | 180s+ | 30% smaller, 70% equal/larger | All hazards active |

---

## 8. Technical Architecture

### 8.1 Technology Stack

```yaml
Runtime Environment:
  Node.js: 20.x LTS
  Package Manager: npm 10.x

Frontend Framework:
  Next.js: 16.x
  React: 19.x
  TypeScript: 5.x

Rendering:
  Primary: HTML5 Canvas 2D Context
  Resolution: 800×600 (scales to viewport)
  Target FPS: 60

State Management:
  React: useReducer for game state
  Refs: useRef for mutable game loop data

Audio:
  API: Web Audio API
  Formats: MP3 (fallback), OGG (preferred)

Input:
  Keyboard: WASD + Arrow keys
  Touch: Virtual joystick overlay
  Gamepad: Gamepad API (stretch goal)

Persistence:
  High Scores: localStorage
  Settings: localStorage

Build Output:
  Type: Static HTML/JS/CSS
  Method: next export
```

### 8.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER RUNTIME                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      REACT LAYER                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │
│  │  │ GameCanvas  │  │     HUD     │  │   Screens (Title,   │ │   │
│  │  │ Component   │  │  Component  │  │   GameOver, Pause)  │ │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │   │
│  │         │                │                     │            │   │
│  │         └────────────────┼─────────────────────┘            │   │
│  │                          │                                  │   │
│  │                          ▼                                  │   │
│  │              ┌─────────────────────┐                        │   │
│  │              │    useGameLoop      │                        │   │
│  │              │   (Custom Hook)     │                        │   │
│  │              └──────────┬──────────┘                        │   │
│  │                         │                                   │   │
│  └─────────────────────────┼───────────────────────────────────┘   │
│                            │                                       │
│  ┌─────────────────────────┼───────────────────────────────────┐   │
│  │                    GAME ENGINE                              │   │
│  │                         ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │                   GameLoop.ts                        │   │   │
│  │  │         requestAnimationFrame Controller             │   │   │
│  │  └─────────────────────────┬───────────────────────────┘   │   │
│  │                            │                               │   │
│  │            ┌───────────────┼───────────────┐               │   │
│  │            ▼               ▼               ▼               │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │
│  │  │   Input     │  │  Collision  │  │   Spawn     │        │   │
│  │  │  Manager    │  │   System    │  │   System    │        │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │   │
│  │                                                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │
│  │  │   Audio     │  │   Entity    │  │   Scoring   │        │   │
│  │  │  Manager    │  │  Manager    │  │   System    │        │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │   │
│  │                                                            │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │                    ENTITIES                          │  │   │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │   │
│  │  │  │ Player │ │  Fish  │ │ Shark  │ │ Crab   │ ...   │  │   │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      BROWSER APIs                           │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐│   │
│  │  │ Canvas 2D    │ │ Web Audio    │ │ localStorage         ││   │
│  │  │ Context      │ │ API          │ │ (High Scores)        ││   │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3 Game Loop Architecture

```typescript
// Timing constants
const FIXED_TIMESTEP = 1000 / 60;  // 16.67ms (60 FPS physics)
const MAX_FRAME_TIME = 250;         // Prevent spiral of death

class GameLoop {
  private lastTime: number = 0;
  private accumulator: number = 0;
  private running: boolean = false;
  
  private update: (dt: number) => void;
  private render: (interpolation: number) => void;
  
  constructor(update: (dt: number) => void, render: (interpolation: number) => void) {
    this.update = update;
    this.render = render;
  }
  
  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.tick.bind(this));
  }
  
  stop(): void {
    this.running = false;
  }
  
  private tick(currentTime: number): void {
    if (!this.running) return;
    
    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Clamp to prevent spiral of death
    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME;
    }
    
    this.accumulator += frameTime;
    
    // Fixed timestep updates
    while (this.accumulator >= FIXED_TIMESTEP) {
      this.update(FIXED_TIMESTEP / 1000); // Convert to seconds
      this.accumulator -= FIXED_TIMESTEP;
    }
    
    // Render with interpolation for smooth visuals
    const interpolation = this.accumulator / FIXED_TIMESTEP;
    this.render(interpolation);
    
    requestAnimationFrame(this.tick.bind(this));
  }
}
```

---

## 9. Project Structure

```
shark-shark/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout with metadata
│   ├── page.tsx                      # Game entry point
│   ├── globals.css                   # Global styles
│   └── favicon.ico                   # Browser favicon
│
├── components/                       # React Components
│   ├── GameCanvas.tsx                # Main canvas wrapper
│   ├── HUD.tsx                       # Score, lives, tier display
│   ├── TitleScreen.tsx               # Start menu overlay
│   ├── PauseScreen.tsx               # Pause overlay
│   ├── GameOverScreen.tsx            # End screen with high scores
│   ├── TouchControls.tsx             # Mobile joystick overlay
│   └── LoadingScreen.tsx             # Asset loading progress
│
├── game/                             # Game Engine (Framework-Agnostic)
│   │
│   ├── engine/                       # Core Systems
│   │   ├── GameLoop.ts               # RAF loop controller
│   │   ├── InputManager.ts           # Keyboard/touch/gamepad
│   │   ├── CollisionSystem.ts        # AABB detection & resolution
│   │   ├── EntityManager.ts          # Entity lifecycle (pool)
│   │   ├── AudioManager.ts           # Sound effect controller
│   │   ├── AssetLoader.ts            # Sprite/audio preloader
│   │   └── Renderer.ts               # Canvas rendering utilities
│   │
│   ├── entities/                     # Game Entities
│   │   ├── Entity.ts                 # Abstract base class
│   │   ├── Player.ts                 # Player fish
│   │   ├── Fish.ts                   # NPC fish (all sizes)
│   │   ├── Shark.ts                  # Boss predator
│   │   ├── Crab.ts                   # Floor hazard
│   │   ├── Jellyfish.ts              # Floating hazard
│   │   ├── Seahorse.ts               # Bonus pickup
│   │   └── Bubble.ts                 # Visual particle
│   │
│   ├── systems/                      # Game Systems
│   │   ├── SpawnSystem.ts            # Enemy wave management
│   │   ├── GrowthSystem.ts           # Player tier progression
│   │   ├── ScoringSystem.ts          # Point calculation
│   │   ├── DifficultySystem.ts       # Dynamic difficulty
│   │   └── ParticleSystem.ts         # Visual effects
│   │
│   ├── state/                        # State Management
│   │   ├── GameState.ts              # Central state interface
│   │   ├── gameReducer.ts            # State transition logic
│   │   └── actions.ts                # Action type definitions
│   │
│   ├── constants.ts                  # Magic numbers & config
│   └── types.ts                      # Shared type definitions
│
├── hooks/                            # Custom React Hooks
│   ├── useGameLoop.ts                # RAF integration hook
│   ├── useInput.ts                   # Input state hook
│   ├── useAudio.ts                   # Audio control hook
│   ├── useHighScores.ts              # localStorage hook
│   └── useResponsiveCanvas.ts        # Canvas scaling hook
│
├── assets/                           # Game Assets
│   ├── sprites/                      # PNG spritesheets
│   │   ├── player.png                # Player fish (all tiers)
│   │   ├── fish.png                  # NPC fish spritesheet
│   │   ├── shark.png                 # Shark sprite
│   │   ├── hazards.png               # Crab, jellyfish
│   │   ├── bonus.png                 # Seahorse, bubbles
│   │   └── background.png            # Ocean backdrop
│   │
│   └── sounds/                       # Audio Files
│       ├── eat.ogg                   # Eating sound
│       ├── death.ogg                 # Player death
│       ├── levelup.ogg               # Tier increase
│       ├── shark.ogg                 # Shark warning
│       ├── bonus.ogg                 # Seahorse collect
│       └── music.ogg                 # Background music
│
├── lib/                              # Utility Functions
│   ├── utils.ts                      # General helpers
│   ├── math.ts                       # Vector math, interpolation
│   └── storage.ts                    # localStorage wrapper
│
├── public/                           # Static Files
│   ├── og-image.png                  # Social sharing image
│   └── manifest.json                 # PWA manifest (optional)
│
├── infra/                            # AWS CDK Infrastructure
│   ├── bin/
│   │   └── infra.ts                  # CDK app entry point
│   ├── lib/
│   │   └── shark-shark-stack.ts      # Stack definition
│   ├── cdk.json                      # CDK configuration
│   ├── package.json                  # CDK dependencies
│   └── tsconfig.json                 # CDK TypeScript config
│
├── .github/
│   └── workflows/
│       └── deploy.yml                # GitHub Actions CI/CD
│
├── next.config.js                    # Next.js configuration
├── tailwind.config.js                # Tailwind CSS config
├── tsconfig.json                     # TypeScript config
├── package.json                      # Project dependencies
├── .eslintrc.json                    # ESLint rules
├── .prettierrc                       # Prettier config
└── README.md                         # Project documentation
```

---

## 10. Core Interfaces & Types

### 10.1 Game State

```typescript
// game/state/GameState.ts

export type GameStatus = 
  | 'initializing'
  | 'title'
  | 'playing'
  | 'paused'
  | 'dying'
  | 'respawn'
  | 'gameover';

export interface Vector2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlayerState {
  position: Vector2D;
  velocity: Vector2D;
  tier: 1 | 2 | 3 | 4 | 5;
  width: number;
  height: number;
  fishEaten: number;
  fishEatenThisTier: number;
  facingLeft: boolean;
  invulnerable: boolean;
  invulnerableTimer: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  highScore: number;
  lives: number;
  player: PlayerState;
  entities: Entity[];
  difficulty: DifficultyConfig;
  elapsedTime: number;
  isPaused: boolean;
  assetsLoaded: boolean;
}

export interface DifficultyConfig {
  fishSpawnRate: number;
  fishSpeedMultiplier: number;
  sharkEnabled: boolean;
  sharkSpeed: number;
  sharkDiveFrequency: number;
  crabEnabled: boolean;
  jellyfishEnabled: boolean;
  jellyfishCount: number;
  largeFishRatio: number;
}
```

### 10.2 Entity System

```typescript
// game/entities/Entity.ts

export type EntityType = 
  | 'player'
  | 'fish'
  | 'shark'
  | 'crab'
  | 'jellyfish'
  | 'seahorse'
  | 'bubble';

export type FishSize = 'tiny' | 'small' | 'medium' | 'large' | 'giant';

export interface Entity {
  id: string;
  type: EntityType;
  position: Vector2D;
  velocity: Vector2D;
  width: number;
  height: number;
  active: boolean;
  
  update(deltaTime: number, gameState: GameState): void;
  render(ctx: CanvasRenderingContext2D, interpolation: number): void;
  getBoundingBox(): BoundingBox;
  onCollision?(other: Entity, result: CollisionResult): void;
  reset?(): void;
}

export interface FishEntity extends Entity {
  type: 'fish';
  size: FishSize;
  points: number;
}

export interface SharkEntity extends Entity {
  type: 'shark';
  state: 'patrol' | 'dive' | 'return';
  targetY: number;
  diveTimer: number;
}
```

### 10.3 Collision System

```typescript
// game/engine/CollisionSystem.ts

export type CollisionType = 
  | 'eat'
  | 'death'
  | 'shark_tail'
  | 'bonus'
  | 'hazard';

export interface CollisionResult {
  type: CollisionType;
  entityA: Entity;
  entityB: Entity;
  points?: number;
}

export interface CollisionPair {
  a: BoundingBox;
  b: BoundingBox;
}

// AABB intersection test
export function intersects(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Get shark hitbox zones
export function getSharkHitboxes(shark: SharkEntity): {
  body: BoundingBox;
  tail: BoundingBox;
} {
  const tailWidth = shark.width * 0.1;
  const bodyWidth = shark.width * 0.9;
  
  const isMovingLeft = shark.velocity.x < 0;
  
  return {
    body: {
      x: isMovingLeft ? shark.position.x + tailWidth : shark.position.x,
      y: shark.position.y,
      width: bodyWidth,
      height: shark.height,
    },
    tail: {
      x: isMovingLeft ? shark.position.x : shark.position.x + bodyWidth,
      y: shark.position.y,
      width: tailWidth,
      height: shark.height,
    },
  };
}
```

### 10.4 Input System

```typescript
// game/engine/InputManager.ts

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pause: boolean;
  confirm: boolean;
}

export interface InputVector {
  x: number;  // -1 to 1
  y: number;  // -1 to 1
}

export type InputSource = 'keyboard' | 'touch' | 'gamepad';

export interface InputManager {
  getState(): InputState;
  getVector(): InputVector;
  getSource(): InputSource;
  update(): void;
  destroy(): void;
}
```

### 10.5 Actions & Reducer

```typescript
// game/state/actions.ts

export type GameAction =
  | { type: 'ASSETS_LOADED' }
  | { type: 'START_GAME' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'PLAYER_DEATH'; killer: Entity }
  | { type: 'DEATH_ANIM_COMPLETE' }
  | { type: 'RESPAWN_COMPLETE' }
  | { type: 'RESTART' }
  | { type: 'EAT_FISH'; fish: FishEntity; points: number }
  | { type: 'BITE_SHARK_TAIL'; points: number }
  | { type: 'COLLECT_BONUS'; entity: Entity; points: number; extraLife: boolean }
  | { type: 'TIER_UP'; newTier: number }
  | { type: 'EXTRA_LIFE' }
  | { type: 'UPDATE_DIFFICULTY'; config: DifficultyConfig }
  | { type: 'TICK'; deltaTime: number }
  | { type: 'SPAWN_ENTITY'; entity: Entity }
  | { type: 'REMOVE_ENTITY'; id: string }
  | { type: 'UPDATE_HIGH_SCORE'; score: number };

// game/state/gameReducer.ts

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ASSETS_LOADED':
      return { ...state, status: 'title', assetsLoaded: true };
      
    case 'START_GAME':
      return {
        ...state,
        status: 'playing',
        score: 0,
        lives: 3,
        elapsedTime: 0,
        player: createInitialPlayerState(),
        entities: [],
      };
      
    case 'PLAYER_DEATH':
      return {
        ...state,
        status: 'dying',
        lives: state.lives - 1,
      };
      
    case 'DEATH_ANIM_COMPLETE':
      if (state.lives <= 0) {
        return {
          ...state,
          status: 'gameover',
          highScore: Math.max(state.highScore, state.score),
        };
      }
      return {
        ...state,
        status: 'respawn',
        player: {
          ...createInitialPlayerState(),
          invulnerable: true,
          invulnerableTimer: 2,
        },
      };
      
    case 'EAT_FISH':
      const newFishEaten = state.player.fishEaten + 1;
      const newFishEatenThisTier = state.player.fishEatenThisTier + 1;
      return {
        ...state,
        score: state.score + action.points,
        player: {
          ...state.player,
          fishEaten: newFishEaten,
          fishEatenThisTier: newFishEatenThisTier,
        },
        entities: state.entities.filter(e => e.id !== action.fish.id),
      };
      
    case 'TIER_UP':
      const tierDimensions = TIER_DIMENSIONS[action.newTier as keyof typeof TIER_DIMENSIONS];
      return {
        ...state,
        player: {
          ...state.player,
          tier: action.newTier as 1 | 2 | 3 | 4 | 5,
          width: tierDimensions.width,
          height: tierDimensions.height,
          fishEatenThisTier: 0,
        },
      };
      
    // ... additional cases
      
    default:
      return state;
  }
}
```

---

## 11. System Implementations

### 11.1 Spawn System

```typescript
// game/systems/SpawnSystem.ts

import { v4 as uuidv4 } from 'uuid';

interface SpawnConfig {
  fishSpawnRate: number;
  fishSpeedMultiplier: number;
  sharkEnabled: boolean;
  largeFishRatio: number;
}

export class SpawnSystem {
  private spawnTimer: number = 0;
  private sharkActive: boolean = false;
  private config: SpawnConfig;
  
  constructor(config: SpawnConfig) {
    this.config = config;
  }
  
  update(deltaTime: number, gameState: GameState): Entity[] {
    const newEntities: Entity[] = [];
    
    // Fish spawning
    this.spawnTimer += deltaTime;
    const spawnInterval = 1 / this.config.fishSpawnRate;
    
    while (this.spawnTimer >= spawnInterval) {
      this.spawnTimer -= spawnInterval;
      const fish = this.createFish(gameState);
      newEntities.push(fish);
    }
    
    // Shark spawning
    if (this.config.sharkEnabled && !this.sharkActive) {
      const shark = this.createShark();
      newEntities.push(shark);
      this.sharkActive = true;
    }
    
    return newEntities;
  }
  
  private createFish(gameState: GameState): FishEntity {
    const size = this.determineFishSize(gameState.player.tier);
    const spawnLeft = Math.random() > 0.5;
    const dimensions = FISH_DIMENSIONS[size];
    const speed = FISH_SPEEDS[size] * this.config.fishSpeedMultiplier;
    
    return {
      id: uuidv4(),
      type: 'fish',
      size,
      position: {
        x: spawnLeft ? -dimensions.width : CANVAS_WIDTH,
        y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
      },
      velocity: {
        x: spawnLeft ? speed : -speed,
        y: 0,
      },
      width: dimensions.width,
      height: dimensions.height,
      active: true,
      points: FISH_POINTS[size],
      
      update(dt: number) {
        this.position.x += this.velocity.x * dt;
        
        // Despawn when off-screen
        if (this.position.x < -this.width - 50 || 
            this.position.x > CANVAS_WIDTH + 50) {
          this.active = false;
        }
      },
      
      render(ctx: CanvasRenderingContext2D, interpolation: number) {
        // Sprite rendering logic
      },
      
      getBoundingBox() {
        return {
          x: this.position.x,
          y: this.position.y,
          width: this.width,
          height: this.height,
        };
      },
    };
  }
  
  private determineFishSize(playerTier: number): FishSize {
    const rand = Math.random();
    const largeFishChance = this.config.largeFishRatio;
    
    if (rand < largeFishChance) {
      // Spawn fish larger than player
      const largerSizes = FISH_SIZES.filter(
        s => FISH_DIMENSIONS[s].width >= TIER_DIMENSIONS[playerTier].width
      );
      return largerSizes[Math.floor(Math.random() * largerSizes.length)];
    } else {
      // Spawn fish smaller than player
      const smallerSizes = FISH_SIZES.filter(
        s => FISH_DIMENSIONS[s].width < TIER_DIMENSIONS[playerTier].width
      );
      if (smallerSizes.length === 0) return 'tiny';
      return smallerSizes[Math.floor(Math.random() * smallerSizes.length)];
    }
  }
  
  private createShark(): SharkEntity {
    // Shark implementation
  }
  
  updateConfig(config: SpawnConfig): void {
    this.config = config;
  }
  
  onSharkRemoved(): void {
    this.sharkActive = false;
  }
}
```

### 11.2 Growth System

```typescript
// game/systems/GrowthSystem.ts

const TIER_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 5,
  3: 15,
  4: 30,
  5: 50,
};

export class GrowthSystem {
  checkTierUp(player: PlayerState): number | null {
    const currentTier = player.tier;
    
    if (currentTier >= 5) return null; // Max tier
    
    const nextTier = currentTier + 1;
    const threshold = TIER_THRESHOLDS[nextTier];
    
    if (player.fishEaten >= threshold) {
      return nextTier;
    }
    
    return null;
  }
  
  getProgress(player: PlayerState): number {
    if (player.tier >= 5) return 1;
    
    const currentThreshold = TIER_THRESHOLDS[player.tier];
    const nextThreshold = TIER_THRESHOLDS[player.tier + 1];
    const range = nextThreshold - currentThreshold;
    const progress = player.fishEaten - currentThreshold;
    
    return Math.min(progress / range, 1);
  }
}
```

### 11.3 Collision Detection

```typescript
// game/engine/CollisionSystem.ts

export class CollisionSystem {
  checkCollisions(player: PlayerState, entities: Entity[]): CollisionResult[] {
    const results: CollisionResult[] = [];
    const playerBox = this.getPlayerBox(player);
    
    for (const entity of entities) {
      if (!entity.active) continue;
      
      const entityBox = entity.getBoundingBox();
      
      if (!this.intersects(playerBox, entityBox)) continue;
      
      switch (entity.type) {
        case 'fish':
          results.push(this.handleFishCollision(player, entity as FishEntity));
          break;
          
        case 'shark':
          results.push(this.handleSharkCollision(player, entity as SharkEntity));
          break;
          
        case 'crab':
        case 'jellyfish':
          results.push({
            type: 'hazard',
            entityA: { type: 'player' } as Entity,
            entityB: entity,
          });
          break;
          
        case 'seahorse':
          results.push({
            type: 'bonus',
            entityA: { type: 'player' } as Entity,
            entityB: entity,
            points: 200,
          });
          break;
      }
    }
    
    return results;
  }
  
  private handleFishCollision(player: PlayerState, fish: FishEntity): CollisionResult {
    if (fish.width < player.width) {
      return {
        type: 'eat',
        entityA: { type: 'player' } as Entity,
        entityB: fish,
        points: fish.points * player.tier,
      };
    } else {
      return {
        type: 'death',
        entityA: { type: 'player' } as Entity,
        entityB: fish,
      };
    }
  }
  
  private handleSharkCollision(player: PlayerState, shark: SharkEntity): CollisionResult {
    const { body, tail } = getSharkHitboxes(shark);
    const playerBox = this.getPlayerBox(player);
    
    if (this.intersects(playerBox, tail)) {
      return {
        type: 'shark_tail',
        entityA: { type: 'player' } as Entity,
        entityB: shark,
        points: 500,
      };
    }
    
    if (this.intersects(playerBox, body)) {
      return {
        type: 'death',
        entityA: { type: 'player' } as Entity,
        entityB: shark,
      };
    }
    
    return null!; // No collision (shouldn't reach here)
  }
  
  private getPlayerBox(player: PlayerState): BoundingBox {
    return {
      x: player.position.x,
      y: player.position.y,
      width: player.width,
      height: player.height,
    };
  }
  
  private intersects(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}
```

---

## 12. AWS Infrastructure

### 12.1 Architecture Overview

```
                                    ┌─────────────────────────────────┐
                                    │          ROUTE 53               │
                                    │     (Optional Custom Domain)    │
                                    └───────────────┬─────────────────┘
                                                    │
                                                    │ DNS Resolution
                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS CLOUDFRONT                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         DISTRIBUTION                                 │   │
│  │                                                                      │   │
│  │  • Global Edge Locations (225+)                                     │   │
│  │  • HTTPS Termination (ACM Certificate)                              │   │
│  │  • Gzip/Brotli Compression                                          │   │
│  │  • Cache Policy: CachingOptimized                                   │   │
│  │  • Origin Request Policy: CORS-S3Origin                             │   │
│  │  • Error Pages: 404 → /index.html (SPA support)                     │   │
│  │                                                                      │   │
│  └───────────────────────────────────┬─────────────────────────────────┘   │
│                                      │                                      │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                                       │ Origin Request
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 AWS S3                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    BUCKET: shark-shark-game                          │   │
│  │                                                                      │   │
│  │  Configuration:                                                      │   │
│  │  • Block All Public Access: ENABLED                                 │   │
│  │  • Versioning: DISABLED (static assets)                             │   │
│  │  • Server-Side Encryption: AES-256                                  │   │
│  │  • Access: CloudFront OAI only                                      │   │
│  │                                                                      │   │
│  │  Contents:                                                           │   │
│  │  /                                                                   │   │
│  │  ├── index.html           (entry point)                             │   │
│  │  ├── 404.html             (error page)                              │   │
│  │  ├── _next/                                                         │   │
│  │  │   ├── static/                                                    │   │
│  │  │   │   ├── chunks/      (JS bundles)                              │   │
│  │  │   │   ├── css/         (stylesheets)                             │   │
│  │  │   │   └── media/       (fonts)                                   │   │
│  │  │   └── data/            (pre-rendered data)                       │   │
│  │  ├── assets/                                                        │   │
│  │  │   ├── sprites/         (PNG images)                              │   │
│  │  │   └── sounds/          (audio files)                             │   │
│  │  └── favicon.ico                                                    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │ (Optional)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AWS CERTIFICATE MANAGER                                │
│                                                                             │
│  Certificate: *.sharkshark.game (example)                                  │
│  Validation: DNS (Route 53 auto-validation)                                │
│  Region: us-east-1 (required for CloudFront)                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 CDK Stack Implementation

```typescript
// infra/lib/shark-shark-stack.ts

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface SharkSharkStackProps extends cdk.StackProps {
  /**
   * Environment name (e.g., 'prod', 'staging')
   */
  environment: string;
  
  /**
   * Custom domain name (optional)
   * If provided, requires Route 53 hosted zone and ACM certificate
   */
  domainName?: string;
  
  /**
   * ACM Certificate ARN for custom domain (us-east-1)
   */
  certificateArn?: string;
}

export class SharkSharkStack extends cdk.Stack {
  public readonly distributionUrl: cdk.CfnOutput;
  public readonly bucketName: cdk.CfnOutput;
  
  constructor(scope: Construct, id: string, props: SharkSharkStackProps) {
    super(scope, id, props);
    
    const { environment, domainName, certificateArn } = props;

    // =========================================================================
    // S3 BUCKET - Static Asset Storage
    // =========================================================================
    
    const websiteBucket = new s3.Bucket(this, 'GameAssetsBucket', {
      bucketName: `shark-shark-${environment}-${this.account}`,
      
      // Security: Block all public access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      
      // Encryption at rest
      encryption: s3.BucketEncryption.S3_MANAGED,
      
      // Lifecycle: Allow CDK to delete bucket on stack removal
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
      
      // CORS configuration for game assets
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // =========================================================================
    // CLOUDFRONT DISTRIBUTION - Global CDN
    // =========================================================================
    
    // Origin Access Identity for secure S3 access
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: `OAI for Shark Shark ${environment}`,
      }
    );
    
    // Grant CloudFront read access to S3
    websiteBucket.grantRead(originAccessIdentity);

    // Cache policy for static assets
    const cachePolicy = new cloudfront.CachePolicy(this, 'GameCachePolicy', {
      cachePolicyName: `SharkShark-${environment}-CachePolicy`,
      comment: 'Cache policy for Shark Shark game assets',
      defaultTtl: cdk.Duration.days(1),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.seconds(0),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
    });

    // Response headers policy (security headers)
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      'SecurityHeaders',
      {
        responseHeadersPolicyName: `SharkShark-${environment}-SecurityHeaders`,
        securityHeadersBehavior: {
          contentTypeOptions: { override: true },
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          referrerPolicy: {
            referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true,
          },
          strictTransportSecurity: {
            accessControlMaxAge: cdk.Duration.days(365),
            includeSubdomains: true,
            preload: true,
            override: true,
          },
          xssProtection: {
            protection: true,
            modeBlock: true,
            override: true,
          },
        },
        customHeadersBehavior: {
          customHeaders: [
            {
              header: 'Permissions-Policy',
              value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
              override: true,
            },
          ],
        },
      }
    );

    // Build distribution configuration
    const distributionProps: cloudfront.DistributionProps = {
      comment: `Shark Shark Game - ${environment}`,
      
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy,
        responseHeadersPolicy,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        compress: true,
      },
      
      // SPA routing: redirect 404s to index.html
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
      
      defaultRootObject: 'index.html',
      
      // Price class: Use all edge locations for best performance
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      
      // Enable HTTP/2 and HTTP/3
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      
      // Enable IPv6
      enableIpv6: true,
      
      // Minimum TLS version
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    };

    // Add custom domain if provided
    if (domainName && certificateArn) {
      Object.assign(distributionProps, {
        domainNames: [domainName],
        certificate: cdk.aws_certificatemanager.Certificate.fromCertificateArn(
          this,
          'Certificate',
          certificateArn
        ),
      });
    }

    const distribution = new cloudfront.Distribution(
      this,
      'GameDistribution',
      distributionProps
    );

    // =========================================================================
    // S3 DEPLOYMENT - Upload built assets
    // =========================================================================
    
    new s3deploy.BucketDeployment(this, 'DeployGameAssets', {
      sources: [s3deploy.Source.asset('../out')],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
      
      // Prune old files
      prune: true,
      
      // Cache control headers
      cacheControl: [
        s3deploy.CacheControl.setPublic(),
        s3deploy.CacheControl.maxAge(cdk.Duration.days(365)),
        s3deploy.CacheControl.sMaxAge(cdk.Duration.days(365)),
      ],
      
      // Exclude index.html from long cache (for deployments)
      exclude: ['index.html'],
    });
    
    // Deploy index.html with short cache for updates
    new s3deploy.BucketDeployment(this, 'DeployIndexHtml', {
      sources: [s3deploy.Source.asset('../out', { exclude: ['**', '!index.html'] })],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/index.html'],
      cacheControl: [
        s3deploy.CacheControl.setPublic(),
        s3deploy.CacheControl.maxAge(cdk.Duration.minutes(5)),
        s3deploy.CacheControl.sMaxAge(cdk.Duration.minutes(5)),
      ],
    });

    // =========================================================================
    // OUTPUTS
    // =========================================================================
    
    this.distributionUrl = new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
      exportName: `SharkShark-${environment}-DistributionUrl`,
    });
    
    this.bucketName = new cdk.CfnOutput(this, 'BucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `SharkShark-${environment}-BucketName`,
    });
    
    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID (for cache invalidation)',
      exportName: `SharkShark-${environment}-DistributionId`,
    });
    
    if (domainName) {
      new cdk.CfnOutput(this, 'CustomDomainUrl', {
        value: `https://${domainName}`,
        description: 'Custom Domain URL',
        exportName: `SharkShark-${environment}-CustomDomainUrl`,
      });
    }
  }
}
```

### 12.3 CDK App Entry Point

```typescript
// infra/bin/infra.ts

#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SharkSharkStack } from '../lib/shark-shark-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';

// Production stack
if (environment === 'prod') {
  new SharkSharkStack(app, 'SharkShark-Prod', {
    environment: 'prod',
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1', // Required for CloudFront + ACM
    },
    // Uncomment and configure for custom domain:
    // domainName: 'play.sharkshark.game',
    // certificateArn: 'arn:aws:acm:us-east-1:123456789:certificate/abc-123',
  });
}

// Development/Staging stack
if (environment === 'dev' || environment === 'staging') {
  new SharkSharkStack(app, `SharkShark-${environment.charAt(0).toUpperCase() + environment.slice(1)}`, {
    environment,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
  });
}

app.synth();
```

### 12.4 CDK Configuration

```json
// infra/cdk.json
{
  "app": "npx ts-node --prefer-ts-exts bin/infra.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false
  }
}
```

### 12.5 Infrastructure Package.json

```json
// infra/package.json
{
  "name": "shark-shark-infra",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk",
    "deploy:dev": "cdk deploy --context environment=dev --require-approval never",
    "deploy:staging": "cdk deploy --context environment=staging --require-approval never",
    "deploy:prod": "cdk deploy --context environment=prod",
    "diff": "cdk diff",
    "synth": "cdk synth",
    "destroy:dev": "cdk destroy --context environment=dev --force"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "aws-cdk": "^2.115.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.2"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.115.0",
    "constructs": "^10.3.0",
    "source-map-support": "^0.5.21"
  }
}
```

### 12.6 Infrastructure TypeScript Config

```json
// infra/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "outDir": "./dist",
    "rootDir": "./"
  },
  "include": ["bin/**/*", "lib/**/*"],
  "exclude": ["node_modules", "cdk.out"]
}
```

---

## 13. CI/CD Pipeline

### 13.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Build and Deploy Shark Shark

on:
  push:
    branches:
      - main
      - staging
  pull_request:
    branches:
      - main

env:
  NODE_VERSION: '20'
  AWS_REGION: 'us-east-1'

jobs:
  # ==========================================================================
  # BUILD JOB
  # ==========================================================================
  build:
    name: Build Application
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Linter
        run: npm run lint

      - name: Run Type Check
        run: npm run type-check

      - name: Run Tests
        run: npm run test -- --coverage --passWithNoTests

      - name: Build Application
        run: npm run build
        env:
          NEXT_OUTPUT: export

      - name: Upload Build Artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: out/
          retention-days: 1

  # ==========================================================================
  # DEPLOY STAGING JOB
  # ==========================================================================
  deploy-staging:
    name: Deploy to Staging
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    environment:
      name: staging
      url: ${{ steps.deploy.outputs.distribution_url }}
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Download Build Artifact
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: out/

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Install CDK Dependencies
        working-directory: ./infra
        run: npm ci

      - name: Deploy Infrastructure
        id: deploy
        working-directory: ./infra
        run: |
          npx cdk deploy --context environment=staging --require-approval never --outputs-file outputs.json
          echo "distribution_url=$(jq -r '.["SharkShark-Staging"].DistributionUrl' outputs.json)" >> $GITHUB_OUTPUT

      - name: Post Deployment URL
        run: |
          echo "### 🦈 Staging Deployment Complete!" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**URL:** ${{ steps.deploy.outputs.distribution_url }}" >> $GITHUB_STEP_SUMMARY

  # ==========================================================================
  # DEPLOY PRODUCTION JOB
  # ==========================================================================
  deploy-production:
    name: Deploy to Production
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: ${{ steps.deploy.outputs.distribution_url }}
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Download Build Artifact
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: out/

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Install CDK Dependencies
        working-directory: ./infra
        run: npm ci

      - name: Deploy Infrastructure
        id: deploy
        working-directory: ./infra
        run: |
          npx cdk deploy --context environment=prod --require-approval never --outputs-file outputs.json
          echo "distribution_url=$(jq -r '.["SharkShark-Prod"].DistributionUrl' outputs.json)" >> $GITHUB_OUTPUT

      - name: Invalidate CloudFront Cache
        run: |
          DISTRIBUTION_ID=$(jq -r '.["SharkShark-Prod"].DistributionId' ./infra/outputs.json)
          aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

      - name: Post Deployment URL
        run: |
          echo "### 🦈 Production Deployment Complete!" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**URL:** ${{ steps.deploy.outputs.distribution_url }}" >> $GITHUB_STEP_SUMMARY
```

### 13.2 GitHub Actions Secrets Required

| Secret Name | Description | Environment |
|-------------|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key | staging |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key | staging |
| `AWS_ACCESS_KEY_ID_PROD` | Production IAM access key | production |
| `AWS_SECRET_ACCESS_KEY_PROD` | Production IAM secret key | production |

### 13.3 IAM Policy for CI/CD

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CDKBootstrap",
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "ssm:GetParameter"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3Management",
      "Effect": "Allow",
      "Action": [
        "s3:*"
      ],
      "Resource": [
        "arn:aws:s3:::shark-shark-*",
        "arn:aws:s3:::shark-shark-*/*",
        "arn:aws:s3:::cdk-*"
      ]
    },
    {
      "Sid": "CloudFrontManagement",
      "Effect": "Allow",
      "Action": [
        "cloudfront:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMForCDK",
      "Effect": "Allow",
      "Action": [
        "iam:GetRole",
        "iam:PassRole",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy"
      ],
      "Resource": "arn:aws:iam::*:role/cdk-*"
    },
    {
      "Sid": "LambdaForCDK",
      "Effect": "Allow",
      "Action": [
        "lambda:*"
      ],
      "Resource": "arn:aws:lambda:*:*:function:*SharkShark*"
    }
  ]
}
```

---

## 14. Configuration Files

### 14.1 Next.js Configuration

```javascript
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export for S3 deployment
  output: 'export',
  
  // Required for static export
  images: {
    unoptimized: true,
  },
  
  // Trailing slashes for better S3 compatibility
  trailingSlash: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Strict mode for development
  reactStrictMode: true,
  
  // TypeScript strict checking
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint during builds
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Webpack configuration for game assets
  webpack: (config, { isServer }) => {
    // Handle audio files
    config.module.rules.push({
      test: /\.(ogg|mp3|wav)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]',
      },
    });
    
    return config;
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_GAME_VERSION: process.env.npm_package_version,
  },
};

module.exports = nextConfig;
```

### 14.2 TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "ES2020"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/game/*": ["./game/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/lib/*": ["./lib/*"],
      "@/assets/*": ["./assets/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "infra"
  ]
}
```

### 14.3 Package.json

```json
// package.json
{
  "name": "shark-shark",
  "version": "1.0.0",
  "private": true,
  "description": "Classic arcade fish survival game",
  "author": "Your Name",
  "license": "MIT",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prepare": "husky install"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.42",
    "@types/react-dom": "^18.2.17",
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "^6.13.2",
    "@typescript-eslint/parser": "^6.13.2",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.0.4",
    "eslint-config-prettier": "^9.1.0",
    "husky": "^8.0.3",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "lint-staged": "^15.2.0",
    "postcss": "^8.4.32",
    "prettier": "^3.1.1",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.2"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ]
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### 14.4 Tailwind Configuration

```javascript
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#e6f3ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#0073e6',
          600: '#005cb3',
          700: '#004680',
          800: '#002f4d',
          900: '#00192b',
        },
      },
      fontFamily: {
        game: ['Press Start 2P', 'monospace'],
      },
      animation: {
        'swim': 'swim 2s ease-in-out infinite',
        'bubble': 'bubble 3s ease-in infinite',
      },
      keyframes: {
        swim: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bubble: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: 1 },
          '100%': { transform: 'translateY(-100px) scale(1.5)', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};
```

### 14.5 Game Constants

```typescript
// game/constants.ts

// =============================================================================
// CANVAS CONFIGURATION
// =============================================================================

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const GAME_ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;

// =============================================================================
// PLAYER CONFIGURATION
// =============================================================================

export const PLAYER_ACCELERATION = 800;
export const PLAYER_MAX_SPEED = 200;
export const PLAYER_FRICTION = 0.92;
export const PLAYER_TIER_SPEED_BONUS = 10;
export const PLAYER_INITIAL_LIVES = 3;
export const PLAYER_INVULNERABILITY_DURATION = 2; // seconds
export const PLAYER_DEATH_ANIMATION_DURATION = 1.5; // seconds

export const TIER_DIMENSIONS: Record<number, { width: number; height: number }> = {
  1: { width: 16, height: 12 },
  2: { width: 24, height: 18 },
  3: { width: 32, height: 24 },
  4: { width: 48, height: 36 },
  5: { width: 64, height: 48 },
};

export const TIER_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 5,
  3: 15,
  4: 30,
  5: 50,
};

// =============================================================================
// FISH CONFIGURATION
// =============================================================================

export const FISH_SIZES = ['tiny', 'small', 'medium', 'large', 'giant'] as const;

export const FISH_DIMENSIONS: Record<string, { width: number; height: number }> = {
  tiny: { width: 12, height: 9 },
  small: { width: 20, height: 15 },
  medium: { width: 28, height: 21 },
  large: { width: 40, height: 30 },
  giant: { width: 56, height: 42 },
};

export const FISH_SPEEDS: Record<string, number> = {
  tiny: 60,
  small: 80,
  medium: 100,
  large: 120,
  giant: 140,
};

export const FISH_POINTS: Record<string, number> = {
  tiny: 10,
  small: 25,
  medium: 50,
  large: 100,
  giant: 200,
};

// =============================================================================
// SHARK CONFIGURATION
// =============================================================================

export const SHARK_WIDTH = 96;
export const SHARK_HEIGHT = 48;
export const SHARK_BASE_SPEED = 120;
export const SHARK_MAX_SPEED = 200;
export const SHARK_TAIL_RATIO = 0.1; // 10% of body is tail hitbox
export const SHARK_TAIL_POINTS = 500;
export const SHARK_DIVE_TRIGGER_TIME = 1; // seconds player must be below
export const SHARK_PATROL_Y_RANGE = 0.6; // upper 60% of screen

// =============================================================================
// HAZARD CONFIGURATION
// =============================================================================

export const CRAB_WIDTH = 24;
export const CRAB_HEIGHT = 16;
export const CRAB_SPEED = 40;

export const JELLYFISH_WIDTH = 20;
export const JELLYFISH_HEIGHT = 28;
export const JELLYFISH_SPEED = 30;
export const JELLYFISH_MAX_COUNT = 3;

// =============================================================================
// BONUS CONFIGURATION
// =============================================================================

export const SEAHORSE_WIDTH = 16;
export const SEAHORSE_HEIGHT = 24;
export const SEAHORSE_SPEED = 50;
export const SEAHORSE_POINTS = 200;
export const SEAHORSE_EXTRA_LIFE_CHANCE = 0.25;
export const SEAHORSE_SPAWN_MIN_INTERVAL = 45; // seconds
export const SEAHORSE_SPAWN_MAX_INTERVAL = 90; // seconds
export const SEAHORSE_DURATION = 8; // seconds on screen

// =============================================================================
// SCORING CONFIGURATION
// =============================================================================

export const EXTRA_LIFE_THRESHOLDS = [10000, 30000, 60000, 100000];
export const EXTRA_LIFE_INTERVAL_AFTER = 50000; // Every 50k after 100k

// =============================================================================
// DIFFICULTY CONFIGURATION
// =============================================================================

export const DIFFICULTY_RAMP_DURATION = 300; // 5 minutes to max difficulty
export const INITIAL_FISH_SPAWN_RATE = 0.8; // fish per second
export const MAX_FISH_SPAWN_RATE = 2.0;
export const SHARK_ENABLE_TIME = 20; // seconds
export const CRAB_ENABLE_TIER = 2;
export const JELLYFISH_ENABLE_TIME = 60; // seconds

// =============================================================================
// AUDIO CONFIGURATION
// =============================================================================

export const AUDIO_CHANNELS = {
  MUSIC: 'music',
  SFX: 'sfx',
} as const;

export const DEFAULT_MUSIC_VOLUME = 0.3;
export const DEFAULT_SFX_VOLUME = 0.5;

// =============================================================================
// STORAGE KEYS
// =============================================================================

export const STORAGE_KEYS = {
  HIGH_SCORES: 'sharkshark_highscores',
  SETTINGS: 'sharkshark_settings',
} as const;

export const MAX_HIGH_SCORES = 10;
```

---

## 15. Requirements Checklist

### 15.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **FR-01** | Player fish moves in 8 directions via keyboard (WASD/Arrows) | High | ☐ |
| **FR-02** | Player fish moves via touch controls on mobile devices | High | ☐ |
| **FR-03** | Player can only consume fish strictly smaller in size | High | ☐ |
| **FR-04** | Player grows through 5 distinct size tiers | High | ☐ |
| **FR-05** | Tier progression based on cumulative fish eaten | High | ☐ |
| **FR-06** | Player dies on contact with larger/equal fish | High | ☐ |
| **FR-07** | Player dies on contact with shark body | High | ☐ |
| **FR-08** | Player can bite shark tail for bonus points | Medium | ☐ |
| **FR-09** | Player dies on contact with crab | High | ☐ |
| **FR-10** | Player dies on contact with jellyfish | High | ☐ |
| **FR-11** | Seahorse grants bonus points when collected | Medium | ☐ |
| **FR-12** | Seahorse has chance to grant extra life | Medium | ☐ |
| **FR-13** | Player starts with 3 lives | High | ☐ |
| **FR-14** | Game ends when all lives are lost | High | ☐ |
| **FR-15** | Score accumulates based on fish eaten | High | ☐ |
| **FR-16** | Score multiplied by player tier | Medium | ☐ |
| **FR-17** | Extra lives awarded at score thresholds | Medium | ☐ |
| **FR-18** | High scores persist in localStorage | Medium | ☐ |
| **FR-19** | Top 10 high scores displayed | Low | ☐ |
| **FR-20** | Respawn includes invulnerability period | High | ☐ |
| **FR-21** | Player respawns at Tier 1 after death | High | ☐ |
| **FR-22** | Fish spawn from screen edges | High | ☐ |
| **FR-23** | Fish swim horizontally across screen | High | ☐ |
| **FR-24** | Shark patrols horizontally | High | ☐ |
| **FR-25** | Shark dives when player is below | Medium | ☐ |
| **FR-26** | Crab patrols ocean floor | Medium | ☐ |
| **FR-27** | Jellyfish drift vertically | Medium | ☐ |
| **FR-28** | Difficulty increases over time | High | ☐ |
| **FR-29** | Game can be paused | Medium | ☐ |
| **FR-30** | Title screen displays before game start | High | ☐ |
| **FR-31** | Game over screen shows final score | High | ☐ |

### 15.2 Non-Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **NFR-01** | Game runs at 60 FPS on modern browsers | High | ☐ |
| **NFR-02** | Canvas scales responsively to viewport | High | ☐ |
| **NFR-03** | Touch controls work on iOS and Android | High | ☐ |
| **NFR-04** | Audio can be muted/unmuted | Medium | ☐ |
| **NFR-05** | Game pauses when browser tab loses focus | Medium | ☐ |
| **NFR-06** | UI elements have accessible color contrast | Medium | ☐ |
| **NFR-07** | Initial bundle size < 500KB (excl. assets) | Medium | ☐ |
| **NFR-08** | Time to interactive < 3 seconds | Medium | ☐ |
| **NFR-09** | Works in Chrome, Firefox, Safari, Edge | High | ☐ |
| **NFR-10** | No console errors in production | High | ☐ |

### 15.3 Deployment Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **DR-01** | Static export builds via `next build` | High | ☐ |
| **DR-02** | S3 bucket blocks public access | High | ☐ |
| **DR-03** | CloudFront serves HTTPS only | High | ☐ |
| **DR-04** | Cache invalidation on deployment | High | ☐ |
| **DR-05** | CI/CD deploys on merge to main | High | ☐ |
| **DR-06** | Infrastructure defined as CDK code | High | ☐ |
| **DR-07** | Staging environment available | Medium | ☐ |
| **DR-08** | CloudFront uses all edge locations | Medium | ☐ |
| **DR-09** | Security headers configured | Medium | ☐ |
| **DR-10** | S3 objects encrypted at rest | Medium | ☐ |

---

## 16. Development Roadmap

### Phase 1: Foundation (Week 1)

- [ ] Initialize Next.js 16 project with TypeScript
- [ ] Configure Tailwind CSS and project structure
- [ ] Implement game loop with requestAnimationFrame
- [ ] Create canvas component with responsive scaling
- [ ] Build input manager (keyboard support)
- [ ] Create base Entity class

### Phase 2: Core Gameplay (Week 2)

- [ ] Implement Player entity with movement physics
- [ ] Create Fish entities with spawning system
- [ ] Build collision detection system
- [ ] Implement eating/death mechanics
- [ ] Add tier progression system
- [ ] Create basic HUD (score, lives, tier)

### Phase 3: Hazards & Polish (Week 3)

- [ ] Implement Shark with patrol/dive behavior
- [ ] Add Crab floor hazard
- [ ] Add Jellyfish floating hazard
- [ ] Implement Seahorse bonus pickup
- [ ] Create title screen
- [ ] Create game over screen
- [ ] Add pause functionality

### Phase 4: Audio & Visual Polish (Week 4)

- [ ] Integrate sprite assets
- [ ] Add sound effects
- [ ] Add background music
- [ ] Implement particle effects
- [ ] Add screen transitions
- [ ] Mobile touch controls

### Phase 5: Deployment (Week 5)

- [ ] Set up AWS CDK infrastructure
- [ ] Configure GitHub Actions CI/CD
- [ ] Deploy staging environment
- [ ] Performance testing
- [ ] Deploy production environment
- [ ] Monitor and optimize

---

## 17. Appendix

### A. Sprite Sheet Specifications

```
player.png (128×64)
┌────┬────┬────┬────┬────┬────┬────┬────┐
│ T1 │ T1 │ T2 │ T2 │ T3 │ T3 │ T4 │ T4 │  Row 1: Left-facing
│ ← │ ← │ ← │ ← │ ← │ ← │ ← │ ← │
├────┼────┼────┼────┼────┼────┼────┼────┤
│ T1 │ T1 │ T2 │ T2 │ T3 │ T3 │ T4 │ T4 │  Row 2: Right-facing
│ → │ → │ → │ → │ → │ → │ → │ → │
└────┴────┴────┴────┴────┴────┴────┴────┘
     Frame 1  Frame 2 (animation)

fish.png (256×128)
┌────┬────┬────┬────┬────┐
│Tiny│Tiny│Smll│Smll│Med │ ... Size variants
├────┼────┼────┼────┼────┤
│ ← │ ← │ ← │ ← │ ← │ ... Left-facing
├────┼────┼────┼────┼────┤
│ → │ → │ → │ → │ → │ ... Right-facing
└────┴────┴────┴────┴────┘

shark.png (192×96)
┌────────────────────────────────┐
│          SHARK (Left)          │  Row 1
├────────────────────────────────┤
│          SHARK (Right)         │  Row 2
├────────────────────────────────┤
│     SHARK DIVE (Down)          │  Row 3
└────────────────────────────────┘
```

### B. Audio File List

| File | Format | Duration | Description |
|------|--------|----------|-------------|
| `eat.ogg` | OGG Vorbis | 0.3s | Eating sound (chomp) |
| `death.ogg` | OGG Vorbis | 1.0s | Player death |
| `levelup.ogg` | OGG Vorbis | 1.5s | Tier increase fanfare |
| `shark.ogg` | OGG Vorbis | 2.0s | Shark warning (Jaws-like) |
| `bonus.ogg` | OGG Vorbis | 0.5s | Seahorse collected |
| `extralife.ogg` | OGG Vorbis | 1.0s | Extra life awarded |
| `music.ogg` | OGG Vorbis | 120s | Background music (looping) |

### C. Browser Compatibility Matrix

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | 90+ | ✅ Supported | Primary target |
| Firefox | 88+ | ✅ Supported | |
| Safari | 14+ | ✅ Supported | iOS 14+ |
| Edge | 90+ | ✅ Supported | Chromium-based |
| Samsung Internet | 14+ | ✅ Supported | |
| Opera | 76+ | ✅ Supported | |
| IE 11 | — | ❌ Not Supported | |

### D. Cost Estimation (AWS)

| Service | Usage Assumption | Monthly Cost |
|---------|------------------|--------------|
| S3 Standard | 50 MB storage | $0.00 |
| S3 Requests | 100,000 GET | $0.04 |
| CloudFront | 10 GB transfer | $0.85 |
| CloudFront | 500,000 requests | $0.50 |
| Route 53 | 1 hosted zone | $0.50 |
| **Total (Low Traffic)** | | **~$1.89/mo** |

| Service | Usage Assumption | Monthly Cost |
|---------|------------------|--------------|
| S3 Standard | 50 MB storage | $0.00 |
| S3 Requests | 1,000,000 GET | $0.40 |
| CloudFront | 100 GB transfer | $8.50 |
| CloudFront | 5,000,000 requests | $5.00 |
| Route 53 | 1 hosted zone | $0.50 |
| **Total (Medium Traffic)** | | **~$14.40/mo** |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | — | Initial document |

---

*End of Document*
