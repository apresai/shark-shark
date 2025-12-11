/**
 * useAudio Hook
 * 
 * Integrates AudioManager with React and triggers sounds on game events.
 * 
 * Requirements: 12.1-12.4
 * - 12.1: Play eat sound when player eats fish
 * - 12.2: Play death sound when player dies
 * - 12.3: Play level up sound when player increases tier
 * - 12.4: Play shark warning sound when shark dives
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AudioManager, MusicMode } from '../game/engine/AudioManager';
import type { GameState, SoundEffect, AudioChannel } from '../game/types';

export interface UseAudioOptions {
  /** Initial music volume (0-1) */
  musicVolume?: number;
  /** Initial SFX volume (0-1) */
  sfxVolume?: number;
  /** Initial muted state */
  muted?: boolean;
  /** Whether to auto-load sounds on mount */
  autoLoad?: boolean;
}

export interface UseAudioReturn {
  /** Play a sound effect */
  playSound: (sound: SoundEffect) => void;
  /** Start background music */
  playMusic: () => void;
  /** Stop background music */
  stopMusic: () => void;
  /** Toggle mute state */
  toggleMute: () => void;
  /** Set muted state */
  setMuted: (muted: boolean) => void;
  /** Set volume for a channel */
  setVolume: (channel: AudioChannel, volume: number) => void;
  /** Set music mode (normal or danger) */
  setMusicMode: (mode: MusicMode) => void;
  /** Current muted state */
  muted: boolean;
  /** Current music volume */
  musicVolume: number;
  /** Current SFX volume */
  sfxVolume: number;
  /** Whether audio is initialized */
  isInitialized: boolean;
  /** Whether music is playing */
  isMusicPlaying: boolean;
  /** Current music mode */
  musicMode: MusicMode;
  /** Initialize audio (call after user interaction) */
  initialize: () => Promise<void>;
}

/**
 * Custom hook for managing game audio
 */
export function useAudio(options: UseAudioOptions = {}): UseAudioReturn {
  const {
    musicVolume: initialMusicVolume = 0.5,
    sfxVolume: initialSfxVolume = 0.7,
    muted: initialMuted = false,
    autoLoad = true,
  } = options;

  // AudioManager instance
  const audioManagerRef = useRef<AudioManager | null>(null);
  
  // State for UI updates
  const [muted, setMutedState] = useState(initialMuted);
  const [musicVolume, setMusicVolumeState] = useState(initialMusicVolume);
  const [sfxVolume, setSfxVolumeState] = useState(initialSfxVolume);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicMode, setMusicModeState] = useState<MusicMode>('normal');

  // Initialize AudioManager on mount
  useEffect(() => {
    audioManagerRef.current = new AudioManager({
      musicVolume: initialMusicVolume,
      sfxVolume: initialSfxVolume,
      muted: initialMuted,
    });

    return () => {
      audioManagerRef.current?.destroy();
      audioManagerRef.current = null;
    };
  }, [initialMusicVolume, initialSfxVolume, initialMuted]);

  // Initialize audio context and load sounds
  const initialize = useCallback(async () => {
    if (!audioManagerRef.current || isInitialized) return;

    await audioManagerRef.current.initialize();
    
    if (autoLoad) {
      await audioManagerRef.current.loadSounds();
    }
    
    setIsInitialized(audioManagerRef.current.isInitialized());
  }, [autoLoad, isInitialized]);

  // Play sound effect
  const playSound = useCallback((sound: SoundEffect) => {
    audioManagerRef.current?.playSound(sound);
  }, []);

  // Play background music
  const playMusic = useCallback(() => {
    audioManagerRef.current?.playMusic();
    setIsMusicPlaying(audioManagerRef.current?.isMusicPlaying() ?? false);
  }, []);

  // Stop background music
  const stopMusic = useCallback(() => {
    audioManagerRef.current?.stopMusic();
    setIsMusicPlaying(false);
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const newMuted = !muted;
    audioManagerRef.current?.setMuted(newMuted);
    setMutedState(newMuted);
  }, [muted]);

  // Set muted state
  const setMuted = useCallback((newMuted: boolean) => {
    audioManagerRef.current?.setMuted(newMuted);
    setMutedState(newMuted);
  }, []);

  // Set volume for a channel
  const setVolume = useCallback((channel: AudioChannel, volume: number) => {
    audioManagerRef.current?.setVolume(channel, volume);
    if (channel === 'music') {
      setMusicVolumeState(volume);
    } else {
      setSfxVolumeState(volume);
    }
  }, []);

  // Set music mode (normal or danger)
  const setMusicMode = useCallback((mode: MusicMode) => {
    audioManagerRef.current?.setMusicMode(mode);
    setMusicModeState(mode);
  }, []);

  return {
    playSound,
    playMusic,
    stopMusic,
    toggleMute,
    setMuted,
    setVolume,
    setMusicMode,
    muted,
    musicVolume,
    sfxVolume,
    isInitialized,
    isMusicPlaying,
    musicMode,
    initialize,
  };
}

/**
 * Hook to trigger sounds based on game state changes
 * Requirements: 12.1-12.4
 */
export function useGameAudioEvents(
  gameState: GameState,
  audio: UseAudioReturn
): void {
  const { playSound } = audio;
  
  // Track previous state for change detection
  const prevStateRef = useRef<{
    status: GameState['status'];
    tier: number;
    score: number;
    lives: number;
    fishEaten: number;
  } | null>(null);

  useEffect(() => {
    const prevState = prevStateRef.current;
    
    if (!prevState) {
      // Initialize previous state
      prevStateRef.current = {
        status: gameState.status,
        tier: gameState.player.tier,
        score: gameState.score,
        lives: gameState.lives,
        fishEaten: gameState.player.fishEaten,
      };
      return;
    }

    // Requirement 12.2: Play death sound when player dies
    if (prevState.status !== 'dying' && gameState.status === 'dying') {
      playSound('death');
    }

    // Requirement 12.3: Play level up sound when tier increases
    if (gameState.player.tier > prevState.tier) {
      playSound('levelup');
    }

    // Requirement 12.1: Play eat sound when fish eaten increases
    // (This is triggered by score increase from eating fish)
    if (gameState.player.fishEaten > prevState.fishEaten) {
      playSound('eat');
    }

    // Play bonus sound for seahorse collection (score increase without fish eaten increase)
    if (
      gameState.score > prevState.score &&
      gameState.player.fishEaten === prevState.fishEaten &&
      gameState.status === 'playing'
    ) {
      // Could be shark tail or seahorse - play bonus sound
      playSound('bonus');
    }

    // Play extra life sound
    if (gameState.lives > prevState.lives) {
      playSound('extralife');
    }

    // Update previous state
    prevStateRef.current = {
      status: gameState.status,
      tier: gameState.player.tier,
      score: gameState.score,
      lives: gameState.lives,
      fishEaten: gameState.player.fishEaten,
    };
  }, [
    gameState.status,
    gameState.player.tier,
    gameState.score,
    gameState.lives,
    gameState.player.fishEaten,
    playSound,
  ]);
}

/**
 * Hook to manage shark audio: play warning sound on dive and switch music mode
 * Requirement 12.4
 */
export function useSharkAudioEvents(
  entities: GameState['entities'],
  audio: UseAudioReturn
): void {
  const { playSound, setMusicMode } = audio;

  // Track shark states and presence
  const sharkStatesRef = useRef<Map<string, string>>(new Map());
  const hadSharkRef = useRef(false);

  useEffect(() => {
    const currentSharkStates = new Map<string, string>();
    let hasActiveShark = false;

    for (const entity of entities) {
      if (entity.type === 'shark' && entity.active) {
        hasActiveShark = true;

        // Access state property from shark entity
        const sharkEntity = entity as unknown as { id: string; state: string };
        const prevState = sharkStatesRef.current.get(sharkEntity.id);

        // Requirement 12.4: Play shark warning when shark enters dive state
        if (prevState !== 'dive' && sharkEntity.state === 'dive') {
          playSound('shark');
        }

        currentSharkStates.set(sharkEntity.id, sharkEntity.state);
      }
    }

    // Switch music mode based on shark presence
    if (hasActiveShark && !hadSharkRef.current) {
      // Shark just appeared - switch to danger music
      setMusicMode('danger');
    } else if (!hasActiveShark && hadSharkRef.current) {
      // Shark just left - switch back to normal music
      setMusicMode('normal');
    }

    hadSharkRef.current = hasActiveShark;
    sharkStatesRef.current = currentSharkStates;
  }, [entities, playSound, setMusicMode]);
}
