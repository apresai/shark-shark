# Shark Shark - SVG Art Prompts

Use these prompts with AI image generators (Claude, Midjourney, DALL-E, etc.) to create SVG assets for the game. Each prompt includes exact dimensions and style requirements for consistency.

## Style Guidelines

**Overall Art Direction:**
- Clean, vector-style graphics suitable for SVG format
- Bright, saturated colors that pop against dark ocean background
- Fish should have natural proportions: streamlined bodies, proper fin placement, visible scales implied through shading
- Consistent 2D side-view perspective (facing right by default)
- Stylized but anatomically believable fish shapes (not overly cartoonish blobs)

**Technical Requirements:**
- All assets should face RIGHT (game code flips for left-facing)
- Use solid fills, minimal gradients
- No outlines thicker than 2px at native size
- Transparent backgrounds

---

## Player Fish (5 Tiers)

The player is a growing angelfish that evolves through 5 tiers. Each tier shows the same species becoming larger and more formidable, with increasingly elaborate fins.

### Tier 1 - Juvenile Angelfish
**Dimensions:** 16 x 12 pixels
**Prompt:**
```
Create an SVG of a tiny juvenile angelfish, side profile facing right.
Lime green body (#4CAF50) with slightly darker green stripe. Tall, thin body shape
typical of angelfish. Small dorsal fin just starting to develop, forked caudal tail.
Wide curious eye. Streamlined and quick-looking.
Dimensions: 16x12 pixels. Transparent background. Clean vector style.
```

### Tier 2 - Young Angelfish
**Dimensions:** 24 x 18 pixels
**Prompt:**
```
Create an SVG of a young angelfish, side profile facing right.
Electric blue body (#2196F3) with subtle lighter blue vertical bar marking.
Distinctive tall diamond-shaped body, elongated dorsal and anal fins beginning to trail.
Round eye with white catchlight. Graceful swimmer appearance.
Dimensions: 24x18 pixels. Transparent background. Clean vector style.
```

### Tier 3 - Adult Angelfish
**Dimensions:** 32 x 24 pixels
**Prompt:**
```
Create an SVG of an adult angelfish, side profile facing right.
Vibrant orange body (#FF9800) with warm amber accent stripe.
Classic angelfish silhouette with pronounced triangular profile, trailing dorsal
and ventral fins. Alert eye, confident posture. Fins show graceful movement.
Dimensions: 32x24 pixels. Transparent background. Clean vector style.
```

### Tier 4 - Emperor Angelfish
**Dimensions:** 48 x 36 pixels
**Prompt:**
```
Create an SVG of a large emperor-style angelfish, side profile facing right.
Hot pink/magenta body (#E91E63) with subtle darker horizontal accent.
Majestic flowing fins that trail elegantly, tall dramatic profile.
Large commanding eye. Regal bearing, powerful swimmer appearance.
Dimensions: 48x36 pixels. Transparent background. Clean vector style.
```

### Tier 5 - Legendary Angelfish (Max Size)
**Dimensions:** 64 x 48 pixels
**Prompt:**
```
Create an SVG of a magnificent fully-grown angelfish, side profile facing right.
Royal purple body (#9C27B0) with deep violet accent markings.
Spectacular elongated dorsal and anal fins streaming behind like ribbons.
Large wise eye with golden highlight. Apex presence, living jewel of the reef.
Dimensions: 64x48 pixels. Transparent background. Clean vector style.
```

---

## Enemy Fish (5 Sizes)

NPC fish swimming across the screen. Each size is a different reef species with realistic fish anatomy—tapered bodies, proper fin positions, and natural proportions.

### Tiny Enemy - Damselfish
**Dimensions:** 12 x 9 pixels
**Points:** 10
**Color Reference:** Light yellow (#FFE082)
**Prompt:**
```
Create an SVG of a tiny damselfish, side profile facing right.
Golden-yellow body (#FFE082) with slightly darker dorsal edge.
Compact oval body tapering to a forked tail, small pectoral fin, tiny dorsal ridge.
Darting, quick appearance. Single dark eye dot.
Dimensions: 12x9 pixels. Transparent background. Clean vector style.
```

### Small Enemy - Chromis
**Dimensions:** 20 x 15 pixels
**Points:** 25
**Color Reference:** Light green (#81C784)
**Prompt:**
```
Create an SVG of a small green chromis fish, side profile facing right.
Seafoam green body (#81C784) with lighter belly gradient.
Sleek torpedo shape, deeply forked tail for speed, rounded head.
Small dorsal fin along back, delicate pectoral fin. Bright round eye.
Dimensions: 20x15 pixels. Transparent background. Clean vector style.
```

### Medium Enemy - Wrasse
**Dimensions:** 28 x 21 pixels
**Points:** 50
**Color Reference:** Light blue (#64B5F6)
**Prompt:**
```
Create an SVG of a medium-sized wrasse, side profile facing right.
Sky blue body (#64B5F6) with subtle teal lateral stripe.
Elongated streamlined body, pointed snout, continuous dorsal fin running along back.
Rounded tail fin, visible pectoral fin mid-body. Alert round eye.
Dimensions: 28x21 pixels. Transparent background. Clean vector style.
```

### Large Enemy - Parrotfish
**Dimensions:** 40 x 30 pixels
**Points:** 100
**Color Reference:** Light pink (#F06292)
**Prompt:**
```
Create an SVG of a large parrotfish, side profile facing right.
Coral pink body (#F06292) with rose-colored scale pattern suggestion.
Chunky robust body with blunt rounded head, thick lips implied.
Strong crescent tail, prominent dorsal fin, large pectoral fin. Big expressive eye.
Dimensions: 40x30 pixels. Transparent background. Clean vector style.
```

### Giant Enemy - Grouper
**Dimensions:** 56 x 42 pixels
**Points:** 200
**Color Reference:** Light purple (#BA68C8)
**Prompt:**
```
Create an SVG of a giant grouper, side profile facing right.
Lavender-purple body (#BA68C8) with darker purple mottled pattern hints.
Massive thick body with large head, wide mouth slightly open.
Broad rounded tail, strong spiny dorsal fin, hefty pectoral fins.
Intimidating presence, territorial stare. Large unblinking eye.
Dimensions: 56x42 pixels. Transparent background. Clean vector style.
```

---

## Hazards

### Shark (Main Predator) - Great White
**Dimensions:** 96 x 48 pixels
**Tail Section:** Rightmost 10% of body (9.6px) - this is the hittable weak point
**Prompt:**
```
Create an SVG of a great white shark with accurate anatomy, side profile facing right.
Classic great white coloration: steel gray dorsal surface (#424242) with sharp
countershading transition to white underbelly (#E0E0E0).
Distinctive great white features: conical pointed snout, large black eye with no visible
white, powerful torpedo-shaped body thickest at mid-section tapering to tail.
Iconic tall triangular dorsal fin positioned at body center, large curved pectoral fins
angled downward, smaller secondary dorsal and anal fins near tail.
Crescent-shaped caudal (tail) fin with nearly equal upper and lower lobes—the tail section
(rightmost 10%) should be lighter gray (#757575) to indicate the vulnerable hitbox.
Mouth slightly open showing row of triangular serrated teeth.
Apex predator presence, cruising hunting posture.
Dimensions: 96x48 pixels. Transparent background. Clean vector style.
```

### Crab (Floor Hazard) - Dungeness Crab
**Dimensions:** 24 x 16 pixels
**Prompt:**
```
Create an SVG of a dungeness-style crab, three-quarter top-down view facing right.
Rusty orange-brown carapace (#8D4004) with subtle shell texture lines.
Wide oval shell with pointed edges, two large crusher claws extended forward.
Stalked eyes protruding from front of shell, four walking legs visible on each side.
Defensive posture with claws open and ready. Bottom-dwelling menace.
Dimensions: 24x16 pixels. Transparent background. Clean vector style.
```

### Jellyfish (Rising Hazard) - Moon Jelly
**Dimensions:** 20 x 28 pixels
**Prompt:**
```
Create an SVG of a moon jellyfish, front view drifting upward.
Translucent dome bell (#9370DB at 70% opacity) with four visible
horseshoe-shaped gonads faintly visible through the bell.
Delicate frilled oral arms hanging from bell center,
trailing stinging tentacles flowing downward in gentle curves.
Bioluminescent ethereal glow, graceful and hypnotic but deadly to touch.
Dimensions: 20x28 pixels (taller than wide). Transparent background. Clean vector style.
```

---

## Bonus Items

### Seahorse (Bonus Collectible) - Lined Seahorse
**Dimensions:** 16 x 24 pixels
**Points:** 200 + 25% chance for extra life
**Prompt:**
```
Create an SVG of a lined seahorse, side profile facing right.
Brilliant gold body (#FFD700) with orange (#FFA500) banding along ridged torso.
Distinctive seahorse anatomy: horse-like head with tubular snout, curved neck,
armored segmented body with bony rings, prehensile tail curled inward.
Small fan-like dorsal fin on back, tiny pectoral fins near head.
Upright swimming posture, delicate and rare. Shimmering treasure of the reef.
Dimensions: 16x24 pixels (taller than wide). Transparent background. Clean vector style.
```

---

## UI Elements

### Life Icon - Mini Angelfish
**Dimensions:** 16 x 16 pixels
**Prompt:**
```
Create an SVG of a tiny angelfish silhouette for the lives display.
Solid green (#4CAF50) simplified angelfish shape—tall diamond body with
trailing dorsal and ventral fin points. No internal detail, just the iconic outline.
Instantly readable as "fish" even at small size. Clean bold silhouette.
Dimensions: 16x16 pixels. Transparent background. Clean vector style.
```

### Bubble (Ambient Decoration)
**Dimensions:** 8 x 8 pixels
**Prompt:**
```
Create an SVG of a rising water bubble.
Pale blue (#B3E5FC) circular shape with white crescent highlight in upper left
suggesting light reflection. Subtle darker blue (#81D4FA) edge on lower right.
Translucent, weightless, drifting upward appearance.
Dimensions: 8x8 pixels. Transparent background. Clean vector style.
```

---

## Animation Frames (Optional)

For animated sprites, create 2-4 frames of each entity:

### Fish Swimming Animation (2-3 frames)
```
Create 3 SVG frames of a [SIZE] [SPECIES] fish swimming animation, side profile facing right.
Frame 1: Caudal tail swept upward, pectoral fin forward
Frame 2: Tail centered, pectoral fin mid-stroke
Frame 3: Caudal tail swept downward, pectoral fin back
Subtle body flex shows thrust generation. Dorsal fin remains stable.
Same species details and coloring as static version.
```

### Jellyfish Pulsing Animation (2-3 frames)
```
Create 3 SVG frames of moon jelly propulsion animation.
Frame 1: Bell contracted inward, tentacles spread wide, expelling water
Frame 2: Bell fully expanded dome, tentacles drawn together below
Frame 3: Bell beginning to contract, tentacles trailing in flow
Rhythmic jet propulsion motion. Bioluminescent glow consistent across frames.
```

### Crab Walking Animation (2 frames)
```
Create 2 SVG frames of dungeness crab scuttling animation, three-quarter view.
Frame 1: Left legs extended, right legs tucked, claws angled up
Frame 2: Right legs extended, left legs tucked, claws angled down
Lateral sideways movement typical of crab locomotion.
```

### Great White Shark Cruising Animation (2 frames)
```
Create 2 SVG frames of great white shark swimming animation, side profile facing right.
Frame 1: Tail swept to upper position, body curved slightly upward
Frame 2: Tail swept to lower position, body curved slightly downward
Powerful sinuous motion, pectoral fins remain steady for lift.
Same coloration and anatomical detail as static version.
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

| Entity | Species | Primary Color | Hex Code |
|--------|---------|---------------|----------|
| Player Tier 1 | Juvenile Angelfish | Lime Green | #4CAF50 |
| Player Tier 2 | Young Angelfish | Electric Blue | #2196F3 |
| Player Tier 3 | Adult Angelfish | Vibrant Orange | #FF9800 |
| Player Tier 4 | Emperor Angelfish | Hot Pink | #E91E63 |
| Player Tier 5 | Legendary Angelfish | Royal Purple | #9C27B0 |
| Enemy Tiny | Damselfish | Golden Yellow | #FFE082 |
| Enemy Small | Chromis | Seafoam Green | #81C784 |
| Enemy Medium | Wrasse | Sky Blue | #64B5F6 |
| Enemy Large | Parrotfish | Coral Pink | #F06292 |
| Enemy Giant | Grouper | Lavender Purple | #BA68C8 |
| Shark Dorsal | Great White | Steel Gray | #424242 |
| Shark Belly | Great White | White | #E0E0E0 |
| Shark Tail | Great White (hitbox) | Light Gray | #757575 |
| Crab | Dungeness | Rusty Brown | #8D4004 |
| Jellyfish | Moon Jelly | Translucent Purple | #9370DB |
| Seahorse | Lined Seahorse | Brilliant Gold | #FFD700 |
| Ocean BG Top | — | Light Blue | #87CEEB |
| Ocean BG Bottom | — | Dark Blue | #0D1B2A |
| Ocean Floor | — | Sandy Brown | #8B4513 |
