/**
 * AudioControls Component
 * 
 * Provides mute/unmute toggle and volume controls for music and SFX.
 * 
 * Requirements: 12.5
 * - Add mute/unmute toggle
 * - Add volume controls for music and SFX
 */

'use client';

import React, { useState, useCallback } from 'react';
import { AudioChannel } from '../game/types';

export interface AudioControlsProps {
  /** Whether audio is currently muted */
  muted: boolean;
  /** Music volume (0-1) */
  musicVolume: number;
  /** SFX volume (0-1) */
  sfxVolume: number;
  /** Callback when mute state changes */
  onMuteToggle: (muted: boolean) => void;
  /** Callback when volume changes */
  onVolumeChange: (channel: AudioChannel, volume: number) => void;
}

export function AudioControls({
  muted,
  musicVolume,
  sfxVolume,
  onMuteToggle,
  onVolumeChange,
}: AudioControlsProps) {
  const [expanded, setExpanded] = useState(false);

  const handleMuteClick = useCallback(() => {
    onMuteToggle(!muted);
  }, [muted, onMuteToggle]);

  const handleMusicVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onVolumeChange('music', parseFloat(e.target.value));
    },
    [onVolumeChange]
  );

  const handleSfxVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onVolumeChange('sfx', parseFloat(e.target.value));
    },
    [onVolumeChange]
  );

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div style={styles.container}>
      {/* Mute button */}
      <button
        onClick={handleMuteClick}
        style={styles.muteButton}
        aria-label={muted ? 'Unmute audio' : 'Mute audio'}
        title={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* Settings toggle */}
      <button
        onClick={toggleExpanded}
        style={styles.settingsButton}
        aria-label="Audio settings"
        title="Audio settings"
      >
        ⚙️
      </button>

      {/* Expanded volume controls */}
      {expanded && (
        <div style={styles.volumePanel}>
          <div style={styles.volumeRow}>
            <label style={styles.volumeLabel}>🎵 Music</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={musicVolume}
              onChange={handleMusicVolumeChange}
              style={styles.volumeSlider}
              aria-label="Music volume"
            />
            <span style={styles.volumeValue}>
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
          <div style={styles.volumeRow}>
            <label style={styles.volumeLabel}>🔔 SFX</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={sfxVolume}
              onChange={handleSfxVolumeChange}
              style={styles.volumeSlider}
              aria-label="Sound effects volume"
            />
            <span style={styles.volumeValue}>
              {Math.round(sfxVolume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: '20px',
    right: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
    zIndex: 20,
  },
  muteButton: {
    width: '40px',
    height: '40px',
    fontSize: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: '2px solid #88ccff',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  settingsButton: {
    width: '40px',
    height: '40px',
    fontSize: '18px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: '2px solid #88ccff',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  volumePanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: '2px solid #88ccff',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: '180px',
  },
  volumeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  volumeLabel: {
    fontSize: '14px',
    color: '#ffffff',
    minWidth: '60px',
  },
  volumeSlider: {
    flex: 1,
    height: '6px',
    cursor: 'pointer',
    accentColor: '#00ff88',
  },
  volumeValue: {
    fontSize: '12px',
    color: '#88ccff',
    minWidth: '40px',
    textAlign: 'right',
  },
};

export default AudioControls;
