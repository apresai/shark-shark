'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import React from 'react';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 100, 150, 0.4)',
    borderRadius: '8px',
    border: '1px solid rgba(136, 204, 255, 0.3)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2px solid #00ff88',
  },
  userName: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '10px',
    color: '#88ccff',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  button: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '10px',
    padding: '10px 16px',
    backgroundColor: 'rgba(0, 100, 150, 0.6)',
    color: '#88ccff',
    border: '2px solid #88ccff',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  signOutButton: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '8px',
    padding: '6px 10px',
    backgroundColor: 'rgba(255, 100, 100, 0.3)',
    color: '#ff8888',
    border: '1px solid #ff8888',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  loadingText: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: '10px',
    color: '#88ccff',
    opacity: 0.7,
  },
};

interface SignInButtonProps {
  compact?: boolean;
}

export function SignInButton({ compact = false }: SignInButtonProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <span style={styles.loadingText}>...</span>;
  }

  if (session?.user) {
    return (
      <div style={styles.userContainer}>
        {session.user.image && (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            style={styles.avatar}
            referrerPolicy="no-referrer"
          />
        )}
        {!compact && (
          <span style={styles.userName}>{session.user.name}</span>
        )}
        <button
          onClick={() => signOut()}
          style={styles.signOutButton}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 100, 100, 0.5)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 100, 100, 0.3)';
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      style={styles.button}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 150, 200, 0.6)';
        e.currentTarget.style.transform = 'scale(1.02)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 100, 150, 0.6)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {compact ? 'Sign In' : 'Sign in with Google'}
    </button>
  );
}
