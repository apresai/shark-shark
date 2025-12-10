# Shark Shark - Sound Design Prompts

Use these prompts with AI audio generators (Gemini, Vertex AI, ElevenLabs, etc.) to create audio assets for the game. Each prompt includes style requirements and technical specifications for consistency.

## Style Guidelines

**Overall Audio Direction:**
- Retro arcade game aesthetic with modern production quality
- Bright, punchy sounds that cut through the mix
- Underwater/oceanic feel with bubbles, whooshes, and aquatic textures
- Fun and satisfying feedback sounds that reward player actions
- Short, distinct sound effects (avoid long tails or reverb)

**Technical Requirements:**
- Format: MP3 (128-192 kbps) or WAV (16-bit, 44.1kHz)
- Sound Effects: 0.2 - 2.0 seconds max
- Background Music: Seamless loop points
- Normalize all audio to -3dB peak
- No clipping or distortion

---

## Sound Effects

### 1. Eat Sound (`eat.mp3`)
**Duration:** 0.2 - 0.4 seconds
**Trigger:** Player eats a smaller fish
**File:** `/public/sounds/eat.mp3`

**Prompt:**
```
Create a short, satisfying "chomp" sound effect for an underwater arcade game.
Combine a quick bite/munch sound with a subtle bubbly underwater texture.
Should feel rewarding and addictive - players will hear this hundreds of times.
Bright, cartoony style. Think classic arcade "collect item" but underwater.
Duration: 0.3 seconds. No reverb tail. Punchy attack, quick decay.
```

**Alternative Prompt (More Detailed):**
```
Design an underwater eating sound effect:
- Layer 1: Quick "gulp" or "chomp" sound (cartoony, not realistic)
- Layer 2: Subtle bubble burst (tiny bubbles, high frequency)
- Layer 3: Soft "bloop" bass undertone for satisfaction
Attack: Immediate. Sustain: None. Release: 50ms max.
Style: Retro arcade meets Finding Nemo. Playful and satisfying.
```

---

### 2. Death Sound (`death.mp3`)
**Duration:** 0.5 - 1.0 seconds
**Trigger:** Player gets eaten by larger fish, shark, crab, or jellyfish
**File:** `/public/sounds/death.mp3`

**Prompt:**
```
Create a player death sound for an underwater arcade game.
A descending "wah-wah" or "bloop-bloop-bloop" deflation sound.
Communicate failure without being harsh or annoying.
Underwater bubbling descent, cartoony and sympathetic, not scary.
Duration: 0.7 seconds. Classic arcade "game over life lost" feel.
```

**Alternative Prompt:**
```
Design a fish-getting-eaten death sound:
- Start with a surprised "blurp!" gulp sound
- Follow with descending bubbles (3-4 notes going down)
- End with a soft underwater "poof" dispersal
Tone: Comedic defeat, not violent or scary.
Reference: Classic Pac-Man death but underwater/bubbly.
```

---

### 3. Level Up / Tier Up Sound (`levelup.mp3`)
**Duration:** 0.8 - 1.5 seconds
**Trigger:** Player grows to the next size tier (5 tiers total)
**File:** `/public/sounds/levelup.mp3`

**Prompt:**
```
Create a triumphant level-up sound for an underwater arcade game.
Ascending musical phrase (3-5 notes going up) with sparkle/shimmer.
Underwater filter on a classic "power up" fanfare.
Should feel like growing bigger and more powerful.
Duration: 1.0 seconds. Celebratory but not overly long.
```

**Alternative Prompt:**
```
Design a fish evolution/growth sound effect:
- Rising arpeggio (think Mario mushroom but underwater)
- Add bubbly effervescence throughout
- Culminate in a satisfying "bloom" or expansion sound
- Subtle underwater reverb for depth
Musical key: Major scale, triumphant feel.
Think: Leveling up + ocean magic + arcade satisfaction.
```

---

### 4. Shark Warning Sound (`shark.mp3`)
**Duration:** 1.5 - 2.5 seconds
**Trigger:** Shark enters "dive" state to attack
**File:** `/public/sounds/shark.mp3`

**Prompt:**
```
Create an ominous shark warning sound for an arcade game.
Low, pulsing underwater "danger approaching" alert.
Reference the Jaws movie theme but in a short stinger format.
Two low bass notes (dun-dun) with underwater rumble.
Tension-building, makes player feel immediate danger.
Duration: 2.0 seconds. Menacing but arcade-appropriate.
```

**Alternative Prompt:**
```
Design a shark attack warning stinger:
- Start with low frequency rumble/pulse
- Two iconic bass notes (half-step apart, like Jaws: E-F)
- Add subtle underwater "whoosh" of movement
- Build tension with slight crescendo
- End abruptly (shark is NOW attacking)
Style: Arcade horror meets underwater tension.
Not too scary - this is a fun game, not survival horror.
```

---

### 5. Bonus Sound (`bonus.mp3`)
**Duration:** 0.4 - 0.8 seconds
**Trigger:** Collecting seahorse OR biting shark's tail (200-500 points)
**File:** `/public/sounds/bonus.mp3`

**Prompt:**
```
Create a special bonus collection sound for an underwater arcade game.
Magical, sparkly pickup sound with underwater character.
More rewarding than regular eat sound - this is a special item!
Chime-like with bubbles and shimmer. Golden/treasure feel.
Duration: 0.6 seconds. Instant gratification.
```

**Alternative Prompt:**
```
Design a treasure/seahorse collection sound:
- Bright chime or bell tone (C major or G major)
- Layer of sparkle/twinkle (like collecting coins/gems)
- Subtle underwater bubble texture
- Quick "success" musical phrase (ascending 3 notes)
Feel: Finding treasure underwater, magical and rewarding.
Reference: Zelda item get + underwater filter.
```

---

### 6. Extra Life Sound (`extralife.mp3`)
**Duration:** 1.0 - 2.0 seconds
**Trigger:** Player earns an extra life (score milestone or seahorse bonus)
**File:** `/public/sounds/extralife.mp3`

**Prompt:**
```
Create an extra life awarded sound for an underwater arcade game.
The most rewarding sound in the game - player just got another chance!
Triumphant fanfare with sparkles and underwater magic.
Should feel like a gift/reward. Longer and more elaborate than other sounds.
Duration: 1.5 seconds. Celebratory, makes player feel special.
```

**Alternative Prompt:**
```
Design a 1-UP extra life sound effect:
- Start with attention-getting chime
- Follow with triumphant ascending phrase (5-7 notes)
- Add sparkle/shimmer throughout
- Underwater bubble celebration
- End on satisfying resolved note
Reference: Mario 1-UP but underwater and more magical.
Should be the "jackpot" sound that makes players smile.
```

---

## Background Music

### Main Game Music (`music.mp3`)
**Duration:** 60 - 120 seconds (seamless loop)
**Trigger:** Plays during normal gameplay (no shark present)
**File:** `/public/sounds/music.mp3`

**Prompt:**
```
Create looping background music for an underwater arcade game.
Upbeat, playful, and oceanic. Medium tempo (110-130 BPM).
Bubbling synth arpeggios, gentle bass, tropical/aquatic vibes.
Should not be distracting - background energy for gameplay.
Instruments: Synth pads, plucky leads, subtle percussion, bass.
Style: Chiptune meets tropical house meets underwater ambience.
Length: 90 seconds with seamless loop point.
```

**Alternative Prompt:**
```
Compose underwater arcade game background music:

Mood: Playful, adventurous, slightly mysterious
Tempo: 120 BPM
Key: C major or G major (happy, bright)

Elements to include:
- Bubbly synth arpeggios (think 8-bit underwater)
- Gentle pulsing bass (like ocean currents)
- Light percussion (soft kicks, hi-hats, maybe wood blocks)
- Occasional "blip" and "bloop" sound effects
- Subtle pad for underwater atmosphere

Structure:
- Intro: 4 bars
- Section A: 16 bars (main theme)
- Section B: 16 bars (variation)
- Loop back to Section A seamlessly

Reference: Ecco the Dolphin meets Bubble Bobble.
Keep it light and non-intrusive for extended play sessions.
```

---

### Shark Chase Music (`shark-music.mp3`)
**Duration:** 30 - 60 seconds (seamless loop)
**Trigger:** Plays when shark is actively hunting (dive/attack state)
**File:** `/public/sounds/shark-music.mp3`

**Prompt:**
```
Create intense "shark chase" music for an underwater arcade game.
TECHNO/ELECTRONIC VERSION OF JAWS THEME.
Fast tempo (140-160 BPM), driving beat, building tension.
Use the iconic two-note Jaws motif (E-F or similar half-step)
but reimagined as a pulsing techno/EDM track.
Synth bass hits on the Jaws rhythm, layered with:
- Driving four-on-the-floor kick
- Tense synth stabs
- Building intensity
- Underwater filter effects
Should feel urgent and exciting, not horror-movie scary.
Length: 45 seconds with seamless loop point.
```

**Alternative Prompt:**
```
Compose a techno Jaws-inspired shark chase track:

Tempo: 150 BPM
Key: E minor (dark, tense)

Core Elements:
1. THE JAWS MOTIF: Two-note bass (E-F) pulsing pattern
   - Start slow (half notes)
   - Build to eighth notes as intensity rises
   - Use aggressive synth bass (saw wave, filtered)

2. TECHNO BEAT:
   - Hard-hitting kick drum (four-on-the-floor)
   - Snappy snare on 2 and 4
   - Driving hi-hats (16th notes)
   - Occasional crash cymbals for impact

3. SYNTH LAYERS:
   - Tense pad holding minor chord
   - Stabbing synth hits on offbeats
   - Rising pitch bend effects for urgency
   - Underwater "whoosh" sweeps

4. STRUCTURE:
   - 8 bars: Building intro with Jaws motif
   - 16 bars: Full intensity chase
   - 8 bars: Slight variation
   - Loop seamlessly back to intro

Style: Deadmau5 meets Jaws meets arcade game.
Think: "The shark is coming and you need to RUN!"
Make players feel the adrenaline while staying fun, not frightening.
```

---

## Additional Recommended Sounds

These sounds would enhance the game experience but are not currently implemented in the codebase. Consider adding them:

### 7. Crab Pinch Sound (`crab.mp3`) - OPTIONAL
**Duration:** 0.3 - 0.5 seconds
**Trigger:** When crab appears or moves
**File:** `/public/sounds/crab.mp3`

**Prompt:**
```
Create a crab clicking/pinching sound for an underwater game.
Quick "click-click" of crab claws, cartoonish.
Shell-like, chitinous clicking with slight underwater reverb.
Duration: 0.4 seconds. Slightly menacing but playful.
```

---

### 8. Jellyfish Zap Sound (`jellyfish.mp3`) - OPTIONAL
**Duration:** 0.3 - 0.6 seconds
**Trigger:** When jellyfish appears or player touches it
**File:** `/public/sounds/jellyfish.mp3`

**Prompt:**
```
Create an electric zap sound for jellyfish in an underwater game.
Ethereal "bzzzt" with underwater electrical crackle.
Not harsh - magical and dangerous at the same time.
Duration: 0.5 seconds. Floaty and electric.
```

---

### 9. Bubble Ambience (`bubbles.mp3`) - OPTIONAL
**Duration:** 5 - 10 seconds (seamless loop)
**Trigger:** Constant background layer during gameplay
**File:** `/public/sounds/bubbles.mp3`

**Prompt:**
```
Create gentle underwater bubble ambience for background layer.
Soft, random bubble sounds at various pitches and distances.
Very subtle - should barely be noticeable but add atmosphere.
Duration: 8 seconds, seamless loop. Very low volume in mix.
```

---

### 10. Menu/UI Click Sound (`click.mp3`) - OPTIONAL
**Duration:** 0.1 - 0.2 seconds
**Trigger:** Button hover/click in menus
**File:** `/public/sounds/click.mp3`

**Prompt:**
```
Create a soft bubble pop sound for UI interactions.
Small, satisfying "blip" for menu navigation.
Underwater character, gentle and pleasant.
Duration: 0.15 seconds. Quick and responsive.
```

---

### 11. Game Start Sound (`start.mp3`) - OPTIONAL
**Duration:** 1.0 - 2.0 seconds
**Trigger:** When player presses START to begin game
**File:** `/public/sounds/start.mp3`

**Prompt:**
```
Create a game start sound for an underwater arcade game.
Dramatic "dive in!" sound effect with underwater plunge.
Combination of splash, bubbles, and musical accent.
Should feel like jumping into the ocean adventure.
Duration: 1.5 seconds. Energizing and exciting.
```

---

### 12. Game Over Sound (`gameover.mp3`) - OPTIONAL
**Duration:** 2.0 - 3.0 seconds
**Trigger:** When player loses all lives
**File:** `/public/sounds/gameover.mp3`

**Prompt:**
```
Create a game over sound for an underwater arcade game.
Descending, deflating musical phrase. Sad but not devastating.
Underwater "sinking to the bottom" feel with bubbles.
Classic arcade game over vibe with oceanic character.
Duration: 2.5 seconds. Encourages "one more try!"
```

---

### 13. Pause Sound (`pause.mp3`) - OPTIONAL
**Duration:** 0.3 - 0.5 seconds
**Trigger:** When game is paused
**File:** `/public/sounds/pause.mp3`

**Prompt:**
```
Create a pause sound for an underwater game.
Time-stopping "freeze" effect with underwater texture.
Quick downward pitch bend, like everything slowing down.
Duration: 0.4 seconds. Immediate and clear.
```

---

### 14. Resume Sound (`resume.mp3`) - OPTIONAL
**Duration:** 0.3 - 0.5 seconds
**Trigger:** When game resumes from pause
**File:** `/public/sounds/resume.mp3`

**Prompt:**
```
Create a resume/unpause sound for an underwater game.
Time-resuming effect, opposite of pause sound.
Quick upward pitch bend, like everything speeding back up.
Duration: 0.4 seconds. Energizing restart feel.
```

---

## File Structure

Save generated audio files in this structure:
```
public/sounds/
├── eat.mp3           # Core - Player eating fish
├── death.mp3         # Core - Player death
├── levelup.mp3       # Core - Tier increase
├── shark.mp3         # Core - Shark warning
├── bonus.mp3         # Core - Seahorse/shark tail
├── extralife.mp3     # Core - Extra life awarded
├── music.mp3         # Core - Main background music
├── shark-music.mp3   # Core - Shark chase techno
├── crab.mp3          # Optional - Crab sounds
├── jellyfish.mp3     # Optional - Jellyfish zap
├── bubbles.mp3       # Optional - Ambient bubbles
├── click.mp3         # Optional - UI interactions
├── start.mp3         # Optional - Game start
├── gameover.mp3      # Optional - Game over
├── pause.mp3         # Optional - Pause
└── resume.mp3        # Optional - Resume
```

---

## Audio Integration Notes

### Current Implementation Status

The game already has audio infrastructure in place:

| Sound | File Expected | Currently Triggers On |
|-------|---------------|----------------------|
| `eat` | `/sounds/eat.mp3` | Player eats smaller fish |
| `death` | `/sounds/death.mp3` | Player status → 'dying' |
| `levelup` | `/sounds/levelup.mp3` | Player tier increases |
| `shark` | `/sounds/shark.mp3` | Shark enters 'dive' state |
| `bonus` | `/sounds/bonus.mp3` | Seahorse collected OR shark tail bitten |
| `extralife` | `/sounds/extralife.mp3` | Player lives increase |
| `music` | `/sounds/music.mp3` | Game start/restart |

### Code Locations

- **AudioManager:** `src/game/engine/AudioManager.ts`
- **Audio Hooks:** `src/hooks/useAudio.ts`
- **Sound Types:** `src/game/types.ts` (line 228)

### Adding Shark Chase Music

To implement the shark chase music, you'll need to modify:

1. **AudioManager.ts** - Add shark music as a separate track
2. **useAudio.ts** - Switch music when shark state changes
3. **types.ts** - Add new sound type if needed

Example code pattern:
```typescript
// In useSharkAudioEvents hook
if (sharkEntity.state === 'dive' || sharkEntity.state === 'attack') {
  audio.playSharkMusic(); // Switch to techno Jaws
} else if (sharkEntity.state === 'return' || !sharkPresent) {
  audio.playMusic(); // Switch back to normal music
}
```

---

## Sound Design Tips

### For AI Audio Generation

1. **Be specific about duration** - AI tends to make longer sounds than needed
2. **Mention "no reverb tail"** - Prevents sounds from bleeding into each other
3. **Reference known sounds** - "Like Mario coin but underwater" helps calibrate
4. **Specify attack/decay** - Game sounds need punchy attacks
5. **Request stems** - Ask for layered versions for mixing flexibility

### Quality Checklist

- [ ] All sounds cut cleanly (no clicks at start/end)
- [ ] Consistent volume levels across all effects
- [ ] Music loops seamlessly (test with audio editor)
- [ ] Shark music transitions smoothly from/to main music
- [ ] No frequency clashes between sounds playing simultaneously
- [ ] All files properly named and formatted

---

## Color/Sound Palette Summary

For audio-visual consistency, match sound "brightness" to visual colors:

| Entity | Visual Color | Sound Character |
|--------|--------------|-----------------|
| Player Tiers 1-2 | Green/Blue | Light, bubbly |
| Player Tiers 3-4 | Orange/Pink | Medium, confident |
| Player Tier 5 | Purple | Deep, powerful |
| Enemy Fish | Pastel colors | Neutral, prey-like |
| Shark | Dark Gray | Deep, menacing, techno |
| Crab | Brown | Clicking, chitinous |
| Jellyfish | Translucent Purple | Ethereal, electric |
| Seahorse | Gold | Sparkly, magical |

---

## References

### Games with Great Underwater Audio
- Ecco the Dolphin (Genesis/Mega Drive)
- Feeding Frenzy (PopCap)
- Bubble Bobble (arcade)
- Donkey Kong Country (underwater levels)
- Subnautica (modern, atmospheric)

### The Jaws Theme
- Composer: John Williams (1975)
- Key musical element: Two alternating notes (E and F)
- Tempo: Starts slow, accelerates as danger approaches
- For this game: Reinterpret as electronic/techno while keeping the motif recognizable
