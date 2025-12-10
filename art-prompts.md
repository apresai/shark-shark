# Shark Shark - SVG Art Prompts

Use these prompts with AI image generators (Claude, Midjourney, DALL-E, etc.) to create SVG assets for the game. Each prompt includes exact dimensions and style requirements for consistency.

## Style Guidelines

**Overall Art Direction:**
- Clean, vector-style graphics suitable for SVG format
- Bright, saturated colors that pop against dark ocean background
- Simple shapes with minimal detail (game runs at small sizes)
- Consistent 2D side-view perspective (facing right by default)
- Friendly/cartoonish style appropriate for arcade gameplay

**Technical Requirements:**
- All assets should face RIGHT (game code flips for left-facing)
- Use solid fills, minimal gradients
- No outlines thicker than 2px at native size
- Transparent backgrounds

---

## Player Fish (5 Tiers)

The player fish grows through 5 tiers as they eat smaller fish. Each tier should be the same fish species, just larger and slightly more confident/powerful looking.

### Tier 1 - Tiny Player Fish
**Dimensions:** 16 x 12 pixels
**Prompt:**
```
Create a simple SVG of a tiny cute tropical fish, side view facing right.
Bright green body (#4CAF50), small round eye, simple forked tail.
Friendly, slightly nervous expression. Clean vector style, no outlines.
Dimensions: 16x12 pixels. Transparent background.
```

### Tier 2 - Small Player Fish
**Dimensions:** 24 x 18 pixels
**Prompt:**
```
Create an SVG of a small tropical fish, side view facing right.
Bright blue body (#2196F3), round eye with white highlight, forked tail fin.
Slightly more confident expression than tier 1. Clean vector style.
Dimensions: 24x18 pixels. Transparent background.
```

### Tier 3 - Medium Player Fish
**Dimensions:** 32 x 24 pixels
**Prompt:**
```
Create an SVG of a medium-sized tropical fish, side view facing right.
Orange body (#FF9800), prominent eye, defined dorsal and tail fins.
Confident, determined expression. Clean vector style, bold colors.
Dimensions: 32x24 pixels. Transparent background.
```

### Tier 4 - Large Player Fish
**Dimensions:** 48 x 36 pixels
**Prompt:**
```
Create an SVG of a large tropical fish, side view facing right.
Hot pink/magenta body (#E91E63), large expressive eye, flowing fins.
Powerful, assertive expression. Clean vector style with some fin detail.
Dimensions: 48x36 pixels. Transparent background.
```

### Tier 5 - Giant Player Fish (Max Size)
**Dimensions:** 64 x 48 pixels
**Prompt:**
```
Create an SVG of a majestic large tropical fish, side view facing right.
Deep purple body (#9C27B0), large eye with confident gaze, impressive fins.
Dominant, apex predator expression. Clean vector style, regal appearance.
Dimensions: 64x48 pixels. Transparent background.
```

---

## Enemy Fish (5 Sizes)

NPC fish that swim across the screen. Each size should be a distinct species for easy visual identification.

### Tiny Enemy Fish
**Dimensions:** 12 x 9 pixels
**Points:** 10
**Color Reference:** Light yellow (#FFE082)
**Prompt:**
```
Create an SVG of a tiny yellow minnow fish, side view facing right.
Light golden-yellow body (#FFE082), simple oval shape, tiny eye, small tail.
Fast, darting appearance. Minimal detail due to small size.
Dimensions: 12x9 pixels. Transparent background.
```

### Small Enemy Fish
**Dimensions:** 20 x 15 pixels
**Points:** 25
**Color Reference:** Light green (#81C784)
**Prompt:**
```
Create an SVG of a small green fish, side view facing right.
Light green body (#81C784), slightly more detail than tiny fish.
Small round eye, simple fins. Looks like easy prey.
Dimensions: 20x15 pixels. Transparent background.
```

### Medium Enemy Fish
**Dimensions:** 28 x 21 pixels
**Points:** 50
**Color Reference:** Light blue (#64B5F6)
**Prompt:**
```
Create an SVG of a medium blue fish, side view facing right.
Light blue body (#64B5F6), defined eye and fins.
Average-looking fish, neither threatening nor weak.
Dimensions: 28x21 pixels. Transparent background.
```

### Large Enemy Fish
**Dimensions:** 40 x 30 pixels
**Points:** 100
**Color Reference:** Light pink (#F06292)
**Prompt:**
```
Create an SVG of a large pink fish, side view facing right.
Light pink/salmon body (#F06292), prominent eye, larger fins.
Slightly intimidating, only edible by bigger player fish.
Dimensions: 40x30 pixels. Transparent background.
```

### Giant Enemy Fish
**Dimensions:** 56 x 42 pixels
**Points:** 200
**Color Reference:** Light purple (#BA68C8)
**Prompt:**
```
Create an SVG of a giant purple fish, side view facing right.
Light purple body (#BA68C8), large imposing shape, big eye.
Intimidating presence, dangerous to small players. Thick body.
Dimensions: 56x42 pixels. Transparent background.
```

---

## Hazards

### Shark (Main Predator)
**Dimensions:** 96 x 48 pixels
**Tail Section:** Rightmost 10% of body (9.6px) - this is the hittable weak point
**Prompt:**
```
Create an SVG of a menacing great white shark, side view facing right.
Dark gray body (#424242) with lighter gray underbelly.
Sharp triangular dorsal fin, pointed snout, visible teeth, angry eye.
The tail section (rightmost 10%) should be slightly lighter gray (#757575)
to indicate the vulnerable hitbox area.
Predatory, dangerous appearance. Clean vector style.
Dimensions: 96x48 pixels. Transparent background.
```

### Crab (Floor Hazard)
**Dimensions:** 24 x 16 pixels
**Prompt:**
```
Create an SVG of a cartoon crab, front-angled side view.
Reddish-brown shell (#8D4004), two prominent claws on sides.
Small stalked eyes on top, multiple small legs underneath.
Scuttling pose, menacing claws raised slightly.
Dimensions: 24x16 pixels. Transparent background.
```

### Jellyfish (Rising Hazard)
**Dimensions:** 20 x 28 pixels
**Prompt:**
```
Create an SVG of a translucent jellyfish, front view.
Semi-transparent purple bell (#9370DB with 80% opacity).
4-6 trailing tentacles below, wavy/flowing appearance.
Ethereal, glowing quality. Dangerous but beautiful.
Dimensions: 20x28 pixels (taller than wide). Transparent background.
```

---

## Bonus Items

### Seahorse (Bonus Collectible)
**Dimensions:** 16 x 24 pixels
**Points:** 200 + 25% chance for extra life
**Prompt:**
```
Create an SVG of a friendly seahorse, side view facing right.
Golden yellow body (#FFD700) with orange accents (#FFA500).
Curved S-shaped body, curled tail, small snout, cute eye.
Friendly, magical appearance. Sparkle or glow effect welcome.
Dimensions: 16x24 pixels (taller than wide). Transparent background.
```

---

## UI Elements

### Life Icon (Heart or Fish)
**Dimensions:** 16 x 16 pixels
**Prompt:**
```
Create an SVG of a small heart icon OR tiny fish silhouette for lives display.
Bright red (#FF0000) if heart, or green (#4CAF50) if fish.
Simple, instantly recognizable at small size.
Dimensions: 16x16 pixels. Transparent background.
```

### Bubble (Optional Decoration)
**Dimensions:** 8 x 8 pixels
**Prompt:**
```
Create an SVG of a simple water bubble.
Light blue circle with white highlight spot for 3D effect.
Semi-transparent appearance.
Dimensions: 8x8 pixels. Transparent background.
```

---

## Animation Frames (Optional)

For animated sprites, create 2-4 frames of each entity:

### Fish Swimming Animation (2-3 frames)
```
Create 3 SVG frames of a [SIZE] fish swimming animation, side view facing right.
Frame 1: Tail curved slightly up
Frame 2: Tail straight
Frame 3: Tail curved slightly down
Subtle fin movement between frames. Same style as static version.
```

### Jellyfish Pulsing Animation (2-3 frames)
```
Create 3 SVG frames of jellyfish pulsing animation.
Frame 1: Bell contracted, tentacles spread
Frame 2: Bell expanded, tentacles closer together
Frame 3: Bell semi-contracted, tentacles flowing
Smooth, hypnotic movement cycle.
```

### Crab Walking Animation (2 frames)
```
Create 2 SVG frames of crab walking animation, side view.
Frame 1: Legs in position A, claws slightly up
Frame 2: Legs in position B, claws slightly down
Sideways scuttling motion.
```

---

## File Naming Convention

Save generated SVGs with these names:
```
src/assets/
├── player/
│   ├── player-tier1.svg
│   ├── player-tier2.svg
│   ├── player-tier3.svg
│   ├── player-tier4.svg
│   └── player-tier5.svg
├── fish/
│   ├── fish-tiny.svg
│   ├── fish-small.svg
│   ├── fish-medium.svg
│   ├── fish-large.svg
│   └── fish-giant.svg
├── hazards/
│   ├── shark.svg
│   ├── crab.svg
│   └── jellyfish.svg
├── bonus/
│   └── seahorse.svg
└── ui/
    ├── life-icon.svg
    └── bubble.svg
```

---

## Color Palette Summary

| Entity | Primary Color | Hex Code |
|--------|---------------|----------|
| Player Tier 1 | Green | #4CAF50 |
| Player Tier 2 | Blue | #2196F3 |
| Player Tier 3 | Orange | #FF9800 |
| Player Tier 4 | Pink | #E91E63 |
| Player Tier 5 | Purple | #9C27B0 |
| Enemy Tiny | Yellow | #FFE082 |
| Enemy Small | Green | #81C784 |
| Enemy Medium | Blue | #64B5F6 |
| Enemy Large | Pink | #F06292 |
| Enemy Giant | Purple | #BA68C8 |
| Shark Body | Dark Gray | #424242 |
| Shark Tail | Light Gray | #757575 |
| Crab | Brown | #8D4004 |
| Jellyfish | Purple | #9370DB |
| Seahorse | Gold | #FFD700 |
| Ocean BG Top | Light Blue | #87CEEB |
| Ocean BG Bottom | Dark Blue | #0D1B2A |
| Ocean Floor | Brown | #8B4513 |
