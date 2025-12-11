/**
 * AudioManager - Web Audio API based sound system
 * Handles sound effects and music playback with volume controls
 * Requirements: 12.1-12.5
 */

import { SoundEffect, AudioChannel } from '../types';

// Sound file paths (relative to public directory)
const SOUND_PATHS: Record<SoundEffect, string> = {
  eat: '/sounds/bonus.wav',      // Reuse bonus sound for eating
  death: '/sounds/death.wav',
  levelup: '/sounds/bonus.wav',  // Reuse bonus sound for level up
  shark: '/sounds/shark.wav',
  bonus: '/sounds/bonus.wav',
  extralife: '/sounds/bonus.wav', // Reuse bonus sound for extra life
};

// Music tracks - normal gameplay and danger mode
const MUSIC_TRACKS = {
  normal: ['/sounds/music.wav', '/sounds/music2.wav'],
  danger: '/sounds/danger.wav',
};

const MUSIC_PATH = '/sounds/music.wav';

export interface AudioManagerConfig {
  musicVolume?: number;
  sfxVolume?: number;
  muted?: boolean;
}

export type MusicMode = 'normal' | 'danger';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<SoundEffect, AudioBuffer> = new Map();
  private musicBuffer: AudioBuffer | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;

  // Music track management
  private normalMusicBuffers: AudioBuffer[] = [];
  private dangerMusicBuffer: AudioBuffer | null = null;
  private currentTrackIndex: number = 0;
  private currentMusicMode: MusicMode = 'normal';

  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private muted: boolean = false;
  private musicPlaying: boolean = false;
  private initialized: boolean = false;

  constructor(config?: AudioManagerConfig) {
    if (config) {
      this.musicVolume = config.musicVolume ?? 0.5;
      this.sfxVolume = config.sfxVolume ?? 0.7;
      this.muted = config.muted ?? false;
    }
  }

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // Create gain nodes for volume control
      this.masterGainNode = this.audioContext.createGain();
      this.musicGainNode = this.audioContext.createGain();
      this.sfxGainNode = this.audioContext.createGain();
      
      // Connect gain nodes: sfx/music -> master -> destination
      this.musicGainNode.connect(this.masterGainNode);
      this.sfxGainNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.audioContext.destination);
      
      // Set initial volumes
      this.updateVolumes();
      
      this.initialized = true;
    } catch (error) {
      console.warn('AudioManager: Failed to initialize audio context', error);
    }
  }

  /**
   * Load all sound effects into memory
   */
  async loadSounds(): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }
    
    if (!this.audioContext) return;

    const loadPromises: Promise<void>[] = [];

    // Load sound effects
    for (const [effect, path] of Object.entries(SOUND_PATHS)) {
      loadPromises.push(
        this.loadSound(path).then(buffer => {
          if (buffer) {
            this.soundBuffers.set(effect as SoundEffect, buffer);
          }
        })
      );
    }

    // Load normal music tracks
    for (const trackPath of MUSIC_TRACKS.normal) {
      loadPromises.push(
        this.loadSound(trackPath).then(buffer => {
          if (buffer) {
            this.normalMusicBuffers.push(buffer);
          }
        })
      );
    }

    // Load danger music
    loadPromises.push(
      this.loadSound(MUSIC_TRACKS.danger).then(buffer => {
        this.dangerMusicBuffer = buffer;
      })
    );

    await Promise.all(loadPromises);

    // Set default music buffer to first normal track
    if (this.normalMusicBuffers.length > 0) {
      this.musicBuffer = this.normalMusicBuffers[0];
    }
  }

  /**
   * Load a single sound file
   */
  private async loadSound(path: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null;

    try {
      const response = await fetch(path);
      if (!response.ok) {
        console.warn(`AudioManager: Failed to fetch ${path}`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      // Fail silently - audio is optional
      console.warn(`AudioManager: Failed to load sound ${path}`, error);
      return null;
    }
  }

  /**
   * Play a sound effect
   * Requirements: 12.1-12.4
   */
  playSound(sound: SoundEffect): void {
    if (!this.audioContext || !this.sfxGainNode || this.muted) return;

    const buffer = this.soundBuffers.get(sound);
    if (!buffer) {
      // Sound not loaded, fail silently
      return;
    }

    try {
      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.sfxGainNode);
      source.start(0);
    } catch (error) {
      console.warn(`AudioManager: Failed to play sound ${sound}`, error);
    }
  }

  /**
   * Start playing background music with loop
   */
  playMusic(): void {
    if (!this.audioContext || !this.musicGainNode || !this.musicBuffer || this.musicPlaying) return;

    try {
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      this.musicSource = this.audioContext.createBufferSource();
      this.musicSource.buffer = this.musicBuffer;
      this.musicSource.loop = true;
      this.musicSource.connect(this.musicGainNode);
      this.musicSource.start(0);
      this.musicPlaying = true;
    } catch (error) {
      console.warn('AudioManager: Failed to play music', error);
    }
  }

  /**
   * Stop background music
   */
  stopMusic(): void {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
      } catch {
        // Already stopped
      }
      this.musicSource = null;
    }
    this.musicPlaying = false;
  }

  /**
   * Set music mode (normal gameplay or danger/shark nearby)
   * Automatically switches the current track
   */
  setMusicMode(mode: MusicMode): void {
    if (this.currentMusicMode === mode) return;

    this.currentMusicMode = mode;

    if (mode === 'danger' && this.dangerMusicBuffer) {
      this.musicBuffer = this.dangerMusicBuffer;
    } else if (mode === 'normal' && this.normalMusicBuffers.length > 0) {
      this.musicBuffer = this.normalMusicBuffers[this.currentTrackIndex];
    }

    // If music was playing, restart with new track
    if (this.musicPlaying) {
      this.stopMusic();
      this.playMusic();
    }
  }

  /**
   * Get current music mode
   */
  getMusicMode(): MusicMode {
    return this.currentMusicMode;
  }

  /**
   * Cycle to the next normal music track
   * Only affects normal mode, not danger mode
   */
  nextTrack(): void {
    if (this.normalMusicBuffers.length <= 1) return;

    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.normalMusicBuffers.length;

    // Update buffer if in normal mode
    if (this.currentMusicMode === 'normal') {
      this.musicBuffer = this.normalMusicBuffers[this.currentTrackIndex];

      // Restart music if playing
      if (this.musicPlaying) {
        this.stopMusic();
        this.playMusic();
      }
    }
  }

  /**
   * Get current track index (for normal mode)
   */
  getCurrentTrackIndex(): number {
    return this.currentTrackIndex;
  }

  /**
   * Get total number of normal music tracks
   */
  getTrackCount(): number {
    return this.normalMusicBuffers.length;
  }

  /**
   * Set muted state for all audio
   * Requirements: 12.5
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    this.updateVolumes();
  }

  /**
   * Get current muted state
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Set volume for a specific channel
   * Requirements: 12.5
   */
  setVolume(channel: AudioChannel, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (channel === 'music') {
      this.musicVolume = clampedVolume;
    } else {
      this.sfxVolume = clampedVolume;
    }
    
    this.updateVolumes();
  }

  /**
   * Get volume for a specific channel
   */
  getVolume(channel: AudioChannel): number {
    return channel === 'music' ? this.musicVolume : this.sfxVolume;
  }

  /**
   * Update gain node volumes based on current settings
   */
  private updateVolumes(): void {
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.muted ? 0 : 1;
    }
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.musicVolume;
    }
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.sfxVolume;
    }
  }

  /**
   * Check if audio is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if music is currently playing
   */
  isMusicPlaying(): boolean {
    return this.musicPlaying;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopMusic();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.soundBuffers.clear();
    this.musicBuffer = null;
    this.normalMusicBuffers = [];
    this.dangerMusicBuffer = null;
    this.masterGainNode = null;
    this.musicGainNode = null;
    this.sfxGainNode = null;
    this.initialized = false;
    this.currentTrackIndex = 0;
    this.currentMusicMode = 'normal';
  }
}
