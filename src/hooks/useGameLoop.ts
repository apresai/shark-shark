/**
 * useGameLoop Hook
 * 
 * Integrates GameLoop with React lifecycle and connects to game state reducer.
 * Handles pause on focus loss and manages the game loop lifecycle.
 * 
 * Requirements: 10.2, 11.1
 */

import { useEffect, useRef, useReducer, useCallback } from 'react';
import { GameLoop } from '../game/engine/GameLoop';
import { gameReducer, createInitialGameState } from '../game/state/gameReducer';
import type { GameState, GameAction } from '../game/types';
import { gameLogger } from '../lib/gameLogger';

export interface UseGameLoopOptions {
  onUpdate?: (deltaTime: number, gameState: GameState) => void;
  onRender?: (interpolation: number, gameState: GameState) => void;
  pauseOnFocusLoss?: boolean;
}

export interface UseGameLoopReturn {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  isRunning: boolean;
  isPaused: boolean;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  stopGame: () => void;
  restartGame: () => void;
}

/**
 * Custom hook that manages the game loop and integrates with React
 */
export function useGameLoop(options: UseGameLoopOptions = {}): UseGameLoopReturn {
  const {
    onUpdate,
    onRender,
    pauseOnFocusLoss = true,
  } = options;

  // Game state management
  const [gameState, dispatch] = useReducer(gameReducer, createInitialGameState());
  
  // Game loop reference
  const gameLoopRef = useRef<GameLoop | null>(null);
  const wasPlayingBeforeFocusLoss = useRef<boolean>(false);
  
  // Track if we were manually paused (vs auto-paused by focus loss)
  const manuallyPaused = useRef<boolean>(false);
  
  // Use refs to store the latest callbacks and state to avoid recreating the game loop
  const onUpdateRef = useRef(onUpdate);
  const onRenderRef = useRef(onRender);
  const gameStateRef = useRef(gameState);
  const dispatchRef = useRef(dispatch);
  
  // Update refs when values change
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);
  
  useEffect(() => {
    onRenderRef.current = onRender;
  }, [onRender]);
  
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  // Derive game loop status from game state instead of using refs
  const isRunning = ['playing', 'dying', 'respawn', 'paused'].includes(gameState.status);
  const isPaused = gameState.status === 'paused';

  // Initialize game loop once
  useEffect(() => {
    // Create stable callbacks that use refs
    const updateCallback = (deltaTime: number) => {
      const currentState = gameStateRef.current;
      const currentDispatch = dispatchRef.current;
      
      // Handle state-specific logic - use a ref to track dying timer
      switch (currentState.status) {
        case 'dying':
          // The dying state is handled by the reducer - it will transition to respawn
          // We just need to wait and then trigger the respawn
          // This is handled via a separate effect
          break;
          
        case 'respawn':
          // Handle invulnerability timer countdown
          if (currentState.player.invulnerableTimer > 0) {
            const newTimer = Math.max(0, currentState.player.invulnerableTimer - deltaTime / 1000);
            currentDispatch({ 
              type: 'UPDATE_PLAYER', 
              player: { 
                invulnerableTimer: newTimer,
                invulnerable: newTimer > 0
              }
            });
            
            if (newTimer <= 0) {
              // Transition back to playing
              currentDispatch({ type: 'RESUME' });
            }
          }
          break;
      }

      // Update elapsed time
      if (currentState.status === 'playing') {
        currentDispatch({ 
          type: 'UPDATE_ELAPSED_TIME', 
          elapsedTime: currentState.elapsedTime + deltaTime / 1000 
        });
      }

      // Call external update callback
      onUpdateRef.current?.(deltaTime, currentState);
    };

    const renderCallback = (interpolation: number) => {
      onRenderRef.current?.(interpolation, gameStateRef.current);
    };

    gameLoopRef.current = new GameLoop({
      update: updateCallback,
      render: renderCallback,
    });

    return () => {
      gameLoopRef.current?.stop();
      gameLoopRef.current = null;
    };
  }, []); // Empty dependency array - only create once

  // Handle focus loss pause (Requirements 10.2)
  useEffect(() => {
    if (!pauseOnFocusLoss) return;

    const handleFocusLoss = () => {
      if (gameLoopRef.current?.isRunning() && !gameLoopRef.current.isPaused()) {
        wasPlayingBeforeFocusLoss.current = true;
        gameLoopRef.current.pause();
        if (gameStateRef.current.status === 'playing') {
          dispatch({ type: 'PAUSE' });
        }
      }
    };

    const handleFocusGain = () => {
      if (wasPlayingBeforeFocusLoss.current && !manuallyPaused.current) {
        wasPlayingBeforeFocusLoss.current = false;
        if (gameStateRef.current.status === 'paused') {
          dispatch({ type: 'RESUME' });
        }
        gameLoopRef.current?.resume();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLoss();
      } else {
        handleFocusGain();
      }
    };

    window.addEventListener('blur', handleFocusLoss);
    window.addEventListener('focus', handleFocusGain);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleFocusLoss);
      window.removeEventListener('focus', handleFocusGain);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseOnFocusLoss]);

  // Handle dying -> respawn transition after death animation delay
  useEffect(() => {
    if (gameState.status === 'dying') {
      gameLogger.log('DYING_STATE_ENTERED', { lives: gameState.lives });
      const timer = setTimeout(() => {
        gameLogger.log('RESPAWN_TIMER_FIRED', { lives: gameState.lives });
        dispatch({ type: 'RESPAWN' });
      }, 1000); // 1 second death animation
      
      return () => clearTimeout(timer);
    }
  }, [gameState.status, gameState.lives]);

  // Handle respawn -> playing transition when invulnerability ends
  useEffect(() => {
    if (gameState.status === 'respawn') {
      gameLogger.log('RESPAWN_STATE', { 
        invulnerableTimer: gameState.player.invulnerableTimer,
        invulnerable: gameState.player.invulnerable 
      });
      if (gameState.player.invulnerableTimer <= 0) {
        gameLogger.log('COMPLETE_RESPAWN_TRIGGERED');
        dispatch({ type: 'COMPLETE_RESPAWN' });
      }
    }
  }, [gameState.status, gameState.player.invulnerableTimer, gameState.player.invulnerable]);

  // Sync game loop state with game state
  useEffect(() => {
    if (!gameLoopRef.current) return;

    switch (gameState.status) {
      case 'playing':
      case 'dying':
      case 'respawn':
        if (!gameLoopRef.current.isRunning()) {
          gameLoopRef.current.start();
        } else if (gameLoopRef.current.isPaused()) {
          gameLoopRef.current.resume();
        }
        manuallyPaused.current = false;
        break;
        
      case 'paused':
        if (gameLoopRef.current.isRunning() && !gameLoopRef.current.isPaused()) {
          gameLoopRef.current.pause();
        }
        manuallyPaused.current = true;
        break;
        
      case 'title':
      case 'gameover':
        if (gameLoopRef.current.isRunning()) {
          gameLoopRef.current.stop();
        }
        manuallyPaused.current = false;
        break;
    }
  }, [gameState.status]);

  // Game control functions
  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, []);

  const pauseGame = useCallback(() => {
    if (gameState.status === 'playing') {
      dispatch({ type: 'PAUSE' });
    }
  }, [gameState.status]);

  const resumeGame = useCallback(() => {
    if (gameState.status === 'paused') {
      dispatch({ type: 'RESUME' });
    }
  }, [gameState.status]);

  const stopGame = useCallback(() => {
    gameLoopRef.current?.stop();
  }, []);

  const restartGame = useCallback(() => {
    dispatch({ type: 'RESTART' });
  }, []);

  return {
    gameState,
    dispatch,
    isRunning,
    isPaused,
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    restartGame,
  };
}

/**
 * Hook for keyboard controls integration
 */
export function useGameControls(gameLoop: UseGameLoopReturn) {
  const { gameState, pauseGame, resumeGame, startGame, restartGame } = gameLoop;

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          // Requirements 10.2, 10.3: ESC for pause/resume
          if (gameState.status === 'playing') {
            pauseGame();
          } else if (gameState.status === 'paused') {
            resumeGame();
          }
          break;
          
        case 'Enter':
        case ' ': // Space
          // Requirements 10.5: Enter/Space for start/restart
          if (gameState.status === 'title') {
            startGame();
          } else if (gameState.status === 'gameover') {
            restartGame();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.status, pauseGame, resumeGame, startGame, restartGame]);
}
