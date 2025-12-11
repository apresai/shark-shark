# Shark Shark - Game Rules

## Overview

Shark Shark is an arcade survival game where you control a small fish in an ocean environment. Your goal is to eat smaller fish to grow larger while avoiding predators and hazards to achieve the highest score possible.

---

## Controls

### Keyboard
- **WASD** or **Arrow Keys**: Move in 8 directions
- **ESC**: Pause/Resume game

### Mobile
- **Virtual Joystick**: Touch and drag to move

### Movement Physics
- Your fish has momentum-based movement
- When you stop providing input, your fish gradually decelerates (friction: 0.92 per frame)
- Horizontal screen edges **wrap around** (exit left, appear on right)
- Vertical screen edges **block movement** (can't swim above surface or below floor)

---

## Eating Fish

The core mechanic is simple: **eat fish smaller than you, avoid fish bigger than you**.

| If the other fish is... | Result |
|------------------------|--------|
| **Smaller** than you | You eat it and gain points |
| **Equal or larger** | You die and lose a life |

Size is determined by width—if your fish is wider, you can eat it.

---

## Growth Tiers

As you eat fish, you grow through **5 size tiers**:

| Tier | Name | Size (W×H) | Fish Required |
|------|------|------------|---------------|
| 1 | Tiny | 16×12 px | Start |
| 2 | Small | 24×18 px | 5 fish eaten |
| 3 | Medium | 32×24 px | 15 fish eaten |
| 4 | Large | 48×36 px | 30 fish eaten |
| 5 | Giant | 64×48 px | 50 fish eaten |

**Note:** When you die and respawn, you reset to Tier 1.

---

## Scoring

### Fish Points
Points are calculated as: **Base Points × Your Current Tier**

| Fish Size | Base Points | At Tier 1 | At Tier 5 |
|-----------|-------------|-----------|-----------|
| Tiny | 10 | 10 | 50 |
| Small | 25 | 25 | 125 |
| Medium | 50 | 50 | 250 |
| Large | 100 | 100 | 500 |
| Giant | 200 | 200 | 1,000 |

### Special Points
- **Shark Tail Bite**: 500 points (no tier multiplier)
- **Seahorse Collected**: 200 points

### Extra Lives
You earn extra lives at these score thresholds:
- 10,000 points
- 30,000 points
- 60,000 points
- 100,000 points
- Every 50,000 points thereafter

---

## Lives System

- You start with **3 lives**
- Dying costs 1 life and resets you to Tier 1
- After dying, you have **2 seconds of invulnerability** (you flash/blink)
- During invulnerability, you cannot be killed
- When you lose your last life, the game ends

---

## The Shark

The shark is the apex predator and appears after **20 seconds** of gameplay.

### Shark Behavior
1. **Patrol**: The shark swims horizontally across the upper 60% of the screen
2. **Dive**: If you stay directly below the shark for more than 1 second, it dives toward you
3. **Return**: After diving to the floor or reaching its target, it returns to patrol

### Shark Hitbox
- **Body (90%)**: Collision = instant death, regardless of your size
- **Tail (10%)**: Collision = 500 bonus points! (The shark continues swimming)

The tail is at the back of the shark based on its swimming direction.

---

## Hazards

### Crab 🦀
- **Appears**: When you reach Tier 2
- **Behavior**: Patrols left and right along the ocean floor at 40 px/s
- **Danger**: Lethal on contact regardless of your tier

### Jellyfish 🎐
- **Appears**: After 60 seconds of gameplay (up to 3 at a time)
- **Behavior**: Drifts upward at 30 px/s, respawns at floor when reaching surface
- **Danger**: Lethal on contact regardless of your tier

---

## Bonus: Seahorse 🐴

- **Spawns**: Every 45-90 seconds
- **Behavior**: Moves erratically at 50 px/s for 8 seconds, then despawns
- **Reward**: 200 points + **25% chance for an extra life**

---

## Difficulty Progression

The game gets harder over time:

| Time | Change |
|------|--------|
| 0:00 | Game starts, fish spawn at 0.8/second |
| 0:20 | **Shark enabled** |
| 0:60 | **Jellyfish enabled** (up to 3) |
| 5:00 | Fish spawn rate reaches maximum (2.0/second) |

### Additional Scaling Over 5 Minutes:
- Fish spawn rate: 0.8 → 2.0 per second
- Larger fish ratio: 20% → 50%
- Crabs appear once you reach Tier 2

---

## Game States

| State | Trigger |
|-------|---------|
| Title Screen | Game starts |
| Playing | Press Start / Restart |
| Paused | Press ESC or browser loses focus |
| Game Over | Lose all lives |

---

## High Scores

- Top 10 scores are saved locally in your browser
- Scores include: final score, tier reached, and fish eaten
- High scores persist between sessions

---

## Tips for Survival

1. **Stay near the surface early** - fewer hazards spawn there initially
2. **Watch the shark's shadow** - don't linger directly below it
3. **Grow quickly** - larger size means more food options and higher score multipliers
4. **Risk the shark tail** - 500 free points if you're feeling bold
5. **Chase seahorses** - the extra life chance is worth the 8-second hunt
6. **Avoid the floor** - crabs and jellyfish make it dangerous after Tier 2
7. **Use invulnerability wisely** - after respawning, you have 2 seconds to reposition safely

---

*Good luck, little fish!* 🐟
