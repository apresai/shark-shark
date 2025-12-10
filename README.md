# 🦈 Shark Shark

A modern web-based remake of the classic Intellivision game "Shark! Shark!" built with Next.js, React, and TypeScript.

## 🎮 Gameplay

You control a small fish in the ocean. Eat smaller fish to grow bigger, but avoid being eaten by larger fish and hazards!

### Objective
- Eat fish smaller than you to score points
- Grow through 5 tiers by eating enough fish
- Survive as long as possible and achieve a high score

### Controls
| Key | Action |
|-----|--------|
| W / ↑ | Move Up |
| A / ← | Move Left |
| S / ↓ | Move Down |
| D / → | Move Right |
| ESC | Pause / Resume |
| Enter / Space | Start / Restart |

## 🐟 Game Elements

### Player Fish
- Start as a tiny Tier 1 fish
- Eat smaller fish to grow (5 tiers total)
- Tier progression: 5 → 15 → 30 → 50 fish eaten
- Higher tiers are larger and slightly faster

### Enemy Fish
| Size | Points | Speed |
|------|--------|-------|
| Tiny | 10 | Fast |
| Small | 25 | Medium-Fast |
| Medium | 50 | Medium |
| Large | 100 | Slow |
| Giant | 200 | Slowest |

### Hazards
- **Shark** (appears after 80 seconds) - Patrols the upper screen, dives when you're below. Bite its tail for 500 points!
- **Crab** (appears at Tier 2) - Walks along the ocean floor
- **Jellyfish** (appears after 60 seconds) - Floats upward from the bottom

### Bonus
- **Seahorse** - Appears periodically, worth 200 points + 25% chance for extra life

### Extra Lives
Awarded at these score thresholds:
- 10,000 points
- 30,000 points
- 60,000 points
- 100,000 points
- Every 50,000 points after 100k

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd shark-shark

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

### Build for Production

```bash
npm run build
npm start
```

## ⚙️ Configuration

All game settings can be customized in a single file:

```
src/game/constants.ts
```

### Key Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `INITIAL_LIVES` | 3 | Starting lives |
| `PLAYER_BASE_SPEED` | 200 | Player movement speed |
| `TIER_THRESHOLDS` | 0,5,15,30,50 | Fish eaten to reach each tier |
| `DIFFICULTY_CONFIG.sharkEnableTime` | 80 | Seconds until shark appears |
| `DIFFICULTY_CONFIG.maxDifficultyTime` | 300 | Seconds to reach max difficulty |
| `SEAHORSE_CONFIG.extraLifeChance` | 0.25 | Chance for seahorse extra life |

See `src/game/constants.ts` for all available settings with documentation.

## 🏗️ Project Structure

```
shark-shark/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── page.tsx      # Main game page
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── GameCanvas.tsx
│   │   ├── HUD.tsx
│   │   ├── TitleScreen.tsx
│   │   ├── PauseScreen.tsx
│   │   └── GameOverScreen.tsx
│   ├── game/
│   │   ├── constants.ts  # ⭐ All game settings
│   │   ├── types.ts      # TypeScript types
│   │   ├── entities/     # Game entities (Player, Fish, Shark, etc.)
│   │   ├── systems/      # Game systems (Collision, Spawn, etc.)
│   │   ├── engine/       # Game loop and input
│   │   └── state/        # State management
│   ├── hooks/            # React hooks
│   └── lib/              # Utilities
├── __tests__/            # Test files
└── public/               # Static assets
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Development

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Rendering**: HTML5 Canvas
- **State**: React useReducer
- **Testing**: Jest + React Testing Library
- **Styling**: Tailwind CSS

### Architecture
- Fixed timestep game loop (60 FPS)
- Entity-Component pattern for game objects
- Centralized state management with reducer
- Property-based testing for game logic

## 📜 License

MIT License - feel free to use and modify!

## 🎯 Credits

Inspired by the original "Shark! Shark!" game for Intellivision (1982) by Mattel Electronics.
