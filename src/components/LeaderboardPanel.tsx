'use client';

import React, { useEffect, useState } from 'react';
import type { GlobalHighScoreEntry, LeaderboardResponse } from '@/game/types';

const styles = {
  container: {
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '12px',
    color: '#ffcc00',
    textAlign: 'center' as const,
    marginBottom: '16px',
    textShadow: '0 0 10px rgba(255, 204, 0, 0.5)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  entry: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 100, 150, 0.3)',
    borderRadius: '6px',
    border: '1px solid rgba(136, 204, 255, 0.2)',
  },
  rank: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '10px',
    color: '#ffcc00',
    width: '28px',
    textAlign: 'right' as const,
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '2px solid #00ff88',
    flexShrink: 0,
  },
  avatarPlaceholder: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(136, 204, 255, 0.3)',
    border: '2px solid #88ccff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '10px',
    color: '#88ccff',
    flexShrink: 0,
  },
  name: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '8px',
    color: '#88ccff',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  score: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '10px',
    color: '#00ff88',
    textAlign: 'right' as const,
    minWidth: '70px',
  },
  tier: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '8px',
    color: '#ff6644',
    width: '28px',
    textAlign: 'center' as const,
  },
  loading: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '10px',
    color: '#88ccff',
    textAlign: 'center' as const,
    padding: '20px',
  },
  error: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '10px',
    color: '#ff6644',
    textAlign: 'center' as const,
    padding: '20px',
  },
  empty: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '10px',
    color: '#88ccff',
    textAlign: 'center' as const,
    padding: '20px',
    opacity: 0.7,
  },
  highlightEntry: {
    backgroundColor: 'rgba(255, 204, 0, 0.2)',
    border: '1px solid rgba(255, 204, 0, 0.4)',
  },
};

interface LeaderboardPanelProps {
  compact?: boolean;
  highlightUserId?: string;
  onClose?: () => void;
}

export function LeaderboardPanel({ compact = false, highlightUserId, onClose }: LeaderboardPanelProps) {
  const [leaderboard, setLeaderboard] = useState<GlobalHighScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch');
      const data: LeaderboardResponse = await res.json();
      setLeaderboard(data.entries);
    } catch {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number) => score.toLocaleString();

  if (loading) {
    return (
      <div style={styles.container}>
        {!compact && <h2 style={styles.title}>GLOBAL LEADERBOARD</h2>}
        <p style={styles.loading}>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        {!compact && <h2 style={styles.title}>GLOBAL LEADERBOARD</h2>}
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div style={styles.container}>
        {!compact && <h2 style={styles.title}>GLOBAL LEADERBOARD</h2>}
        <p style={styles.empty}>No scores yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {!compact && <h2 style={styles.title}>GLOBAL LEADERBOARD</h2>}
      <div style={styles.list}>
        {leaderboard.map((entry) => {
          const isHighlighted = highlightUserId && entry.userId === highlightUserId;
          return (
            <div
              key={`${entry.userId}-${entry.timestamp}`}
              style={{
                ...styles.entry,
                ...(isHighlighted ? styles.highlightEntry : {}),
              }}
            >
              <span style={styles.rank}>#{entry.rank}</span>
              {entry.photoUrl ? (
                <img
                  src={entry.photoUrl}
                  alt={entry.displayName}
                  style={styles.avatar}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div style={styles.avatarPlaceholder}>?</div>
              )}
              <span style={styles.name}>{entry.displayName}</span>
              <span style={styles.score}>{formatScore(entry.score)}</span>
              <span style={styles.tier}>T{entry.tier}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
