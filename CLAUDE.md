# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Production build (static export to out/)
npm start                # Run production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (80% threshold)

# Run single test file
npm test -- __tests__/unit/systems/CollisionSystem.test.ts

# Linting
npm run lint
```

## Architecture Overview

This is a **Shark! Shark!** game remake built with Next.js 16, React 19, and HTML5 Canvas.

### Core Pattern: Fixed Timestep Game Loop + React State

```
Input → Player.applyInput() → Physics Update (16.67ms fixed) → CollisionSystem → gameReducer → Render (interpolated)
```

- **Physics**: Fixed 60 FPS timestep in `GameLoop.ts` ensures consistent gameplay across refresh rates
- **State**: Single `useReducer` in `page.tsx` is the source of truth (handles 15+ action types)
- **Rendering**: Canvas with interpolation for smooth visuals at any frame rate

### Key Directories

| Path | Purpose |
|------|---------|
| `src/game/constants.ts` | **All game tuning** - speeds, sizes, thresholds, difficulty curves (300+ lines) |
| `src/game/types.ts` | TypeScript interfaces for entities, state, actions (240+ lines) |
| `src/game/entities/` | Game objects (Player, Fish, Shark, Crab, Jellyfish, Seahorse, EntityManager) |
| `src/game/systems/` | Stateless pure functions (Collision, Spawn, Movement, Difficulty, Scoring, Growth, Boundary) |
| `src/game/state/gameReducer.ts` | All state mutations via actions |
| `src/game/engine/` | GameLoop (fixed timestep), InputManager, AudioManager |
| `src/app/page.tsx` | Integration hub - wires systems together via hooks |
| `src/components/` | React UI (GameCanvas, HUD, TitleScreen, PauseScreen, GameOverScreen) |
| `src/hooks/` | useGameLoop, useInput, useAudio - React integration layer |
| `infra/` | AWS CDK infrastructure for S3 + CloudFront deployment |

### Entity-System Design

**Entities** (`src/game/entities/`):
- Implement `Entity` interface with `update(deltaTime, gameState)` and `render(ctx, interpolation)`
- Managed by `EntityManager` with deferred add/remove queues (prevents mid-iteration modification)
- Types: `player`, `fish` (5 sizes), `shark`, `crab`, `jellyfish`, `seahorse`

**Systems** (`src/game/systems/`):
- Static utility classes with pure functions
- Take game state as input, return results
- Pattern: `CollisionSystem.checkCollisions(player, entities) → CollisionResult[]`

### State Flow

```
GameStatus: title → playing ↔ paused → dying → respawn → playing/gameover
```

Game systems (Renderer, SpawnSystem, EntityManager) live in **refs** in `page.tsx` because they have mutable internal state but shouldn't trigger React re-renders.

### Non-Obvious Patterns

1. **Entity-State Duality**: Player exists as both class instance (for update logic) and in game state (for React consistency) - sync happens in update callback

2. **Deferred Entity Operations**: EntityManager queues add/remove operations to avoid modifying collections during iteration

3. **Shark Tail Hitbox**: Uses ratio-based calculation (10% tail for bonus, 90% body for death) rather than separate entity

4. **Focus-Loss Auto-Pause**: Tracks whether pause was automatic vs manual to restore correct state on focus return

5. **Difficulty Curves**: Linear interpolation over 5-minute window (not discrete jumps) - see `DifficultySystem.ts`

## Key Constants Reference

```typescript
// Canvas
CANVAS_WIDTH = 800, CANVAS_HEIGHT = 600

// Player progression (fish eaten to reach tier)
TIER_THRESHOLDS = { 1: 0, 2: 5, 3: 15, 4: 30, 5: 50 }

// Scoring (points multiplied by player tier)
FISH_POINTS = { tiny: 10, small: 25, medium: 50, large: 100, giant: 200 }
SHARK_TAIL_POINTS = 500
SEAHORSE_POINTS = 200 (+ 25% extra life chance)
EXTRA_LIFE_THRESHOLDS = [10000, 30000, 60000, 100000, then +50000]

// Difficulty timing
SHARK_ENABLE_TIME = 80s
JELLYFISH_ENABLE_TIME = 60s
CRAB_ENABLE_TIER = 2
MAX_DIFFICULTY_TIME = 300s (5 min to max difficulty)
```

## Common Modifications

| Task | Where |
|------|-------|
| Adjust game balance | `src/game/constants.ts` |
| Add new entity type | Create `entities/NewType.ts`, update `types.ts`, `SpawnSystem.ts`, `CollisionSystem.ts` |
| Change collision behavior | `CollisionSystem.ts` + collision handlers in `page.tsx` |
| Modify player movement | `Player.ts`, `constants.ts` (PLAYER_* values) |
| Add UI overlay | Create component in `components/`, conditional render in `page.tsx` |
| Change difficulty curve | `DifficultySystem.ts`, `constants.ts` (DIFFICULTY_CONFIG) |

## Infrastructure

AWS CDK project in `infra/` for OpenNext serverless hosting:
- Lambda functions for SSR (Graviton2/ARM64, 2GB)
- DynamoDB for leaderboard high scores
- CloudFront distribution with cache disabled for troubleshooting

## Deployment

**IMPORTANT**:
- Always deploy from the project root using `make deploy`. Do not run CDK commands directly from `infra/`.
- Always deploy to prod on AWS to test changes - there is no staging environment.

```bash
make deploy    # Sources .env.local, builds Next.js, and deploys via CDK
```

**Production URL**: https://sharkshark.apresai.dev

### Authentication (Auth.js v5)
- Google OAuth configured via `src/auth.ts`
- Environment variables: `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- Google OAuth callback: `https://sharkshark.apresai.dev/api/auth/callback/google`
