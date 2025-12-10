/**
 * AudioManager - Web Audio API based sound system
 * Handles sound effects and music playback with volume controls
 * Requirements: 12.1-12.5
 */

import { SoundEffect, AudioChannel } from '../types';

// Sound file paths (relative to public directory)
const SOUND_PATHS: Record<SoundEffect, string> = {
  eat: '/sounds/eat.mp3',
  death: '/sounds/death.mp3',
  levelup: '/sounds/levelup.mp3',
  shark: '/sounds/shark.mp3',
  bonus: '/sounds/bonus.mp3',
  extralife: '/sounds/extralife.mp3',
};

const MUSIC_PATH = '/sounds/music.mp3';

export interface AudioManagerConfig {
  musicVolume?: number;
  sfxVolume?: number;
  muted?: boolean;
}

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<SoundEffect, AudioBuffer> = new Map();
  private musicBuffer: AudioBuffer | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  
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

    // Load music
    loadPromises.push(
      this.loadSound(MUSIC_PATH).then(buffer => {
        this.musicBuffer = buffer;
      })
    );

    await Promise.all(loadPromises);
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
    this.masterGainNode = null;
    this.musicGainNode = null;
    this.sfxGainNode = null;
    this.initialized = false;
  }
}
