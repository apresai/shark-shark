'use client';

/**
 * Main Game Page
 * 
 * Wires up all game systems, components, and state management.
 * Integrates GameCanvas, HUD, screen components with game loop and state.
 * 
 * Requirements: All - Integration of complete game systems
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  GameCanvas,
  GameCanvasHandle,
  HUD,
  TitleScreen,
  PauseScreen,
  GameOverScreen,
  AudioControls
} from '@/components';
import {
  useGameLoop,
  useGameControls,
  useInput,
  useAudio,
  useGameAudioEvents,
  useSharkAudioEvents
} from '@/hooks';
import {
  Renderer,
  CollisionSystem,
  SpawnSystem,
  DifficultySystem
} from '@/game';
import { Player, Shark, EntityManager } from '@/game/entities';
import type { HighScoreEntry, CollisionResult, GameState, FishEntity } from '@/game/types';
import { HIGH_SCORE_STORAGE_KEY, SEAHORSE_CONFIG } from '@/game/constants';
import { gameLogger } from '@/lib/gameLogger';
import { spriteLoader } from '@/game/SpriteLoader';

/**
 * Load high scores from localStorage
 */
function loadHighScores(): HighScoreEntry[] {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data.entries || [];
    }
  } catch (error) {
    console.warn('Failed to load high scores:', error);
  }
  return [];
}

/**
 * Save high score to localStorage
 */
function saveHighScore(entry: HighScoreEntry): void {
  try {
    const entries = loadHighScores();
    entries.push(entry);
    entries.sort((a, b) => b.score - a.score);
    const topEntries = entries.slice(0, 10);
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify({ entries: topEntries }));
  } catch (error) {
    console.warn('Failed to save high score:', error);
  }
}

/**
 * Check if score qualifies for high score table
 */
function qualifiesForHighScore(score: number, entries: HighScoreEntry[]): boolean {
  if (entries.length < 10) return true;
  return score > entries[entries.length - 1].score;
}

export default function GamePage() {
  // Refs for game systems
  const canvasRef = useRef<GameCanvasHandle>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const spawnSystemRef = useRef<SpawnSystem | null>(null);
  const entityManagerRef = useRef<EntityManager | null>(null);
  const playerRef = useRef<Player | null>(null);
  const sharkRef = useRef<Shark | null>(null);
  
  // High scores state - initialize from localStorage
  const [highScores, setHighScores] = useState<HighScoreEntry[]>(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      return loadHighScores();
    }
    return [];
  });
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  
  // Audio initialization state
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Load sprites on mount
  useEffect(() => {
    spriteLoader.loadAll().catch((err) => {
      console.warn('Failed to load some sprites:', err);
    });
  }, []);

  // Initialize hooks
  const input = useInput();
  const audio = useAudio();
  
  // Refs for dispatch function (to avoid circular dependency)
  const dispatchRef = useRef<React.Dispatch<import('@/game/types').GameAction> | null>(null);

  // Handle collisions - defined before gameLoop to avoid circular dependency
  const processCollisions = useCallback((
    collisions: CollisionResult[], 
    currentGameState: GameState,
    dispatch: React.Dispatch<import('@/game/types').GameAction>
  ) => {
    for (const collision of collisions) {
      switch (collision.type) {
        case 'eat':
          // Player ate a fish
          if (collision.points) {
            dispatch({
              type: 'EAT_FISH',
              fish: collision.entityB as FishEntity,
              points: collision.points
            });
          }
          // Mark entity as inactive
          collision.entityB.active = false;
          break;
          
        case 'death':
        case 'hazard':
          // Player died
          gameLogger.logCollision(collision.type.toUpperCase(), {
            invulnerable: currentGameState.player.invulnerable,
            lives: currentGameState.lives,
            entityType: collision.entityB.type
          });
          if (!currentGameState.player.invulnerable) {
            gameLogger.log('PLAYER_DEATH_DISPATCHED', { lives: currentGameState.lives });
            dispatch({ type: 'PLAYER_DEATH' });
          }
          break;
          
        case 'shark_tail':
          // Player bit shark tail
          if (collision.points) {
            dispatch({
              type: 'BITE_SHARK_TAIL',
              points: collision.points
            });
          }
          break;
          
        case 'bonus':
          // Player collected seahorse
          const extraLife = Math.random() < SEAHORSE_CONFIG.extraLifeChance;
          dispatch({
            type: 'COLLECT_SEAHORSE',
            points: collision.points || SEAHORSE_CONFIG.points,
            extraLife
          });
          collision.entityB.active = false;
          break;
      }
    }
  }, []);

  // Store input ref for use in game loop callback
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // Game loop with update and render callbacks
  const gameLoop = useGameLoop({
    pauseOnFocusLoss: true,
    onUpdate: (deltaTime: number, gameState: GameState) => {
      if (gameState.status !== 'playing') return;
      if (!dispatchRef.current) return;
      
      const dispatch = dispatchRef.current;
      const deltaSeconds = deltaTime / 1000;
      
      // Update player position for tap-to-move calculations
      inputRef.current.setPlayerPosition(
        gameState.player.position.x,
        gameState.player.position.y
      );
      
      // Update input manager (processes tap-to-move)
      inputRef.current.update();
      
      // Get input vector
      const inputVector = inputRef.current.getVector();
      
      // Update player movement
      if (playerRef.current) {
        // Sync game state to player entity (for tier/dimension changes from eating fish)
        if (playerRef.current.tier !== gameState.player.tier ||
            playerRef.current.fishEaten !== gameState.player.fishEaten) {
          playerRef.current.setState({
            tier: gameState.player.tier,
            fishEaten: gameState.player.fishEaten,
          });
        }
        
        playerRef.current.applyInput(inputVector, deltaSeconds);
        playerRef.current.update(deltaSeconds, gameState);
        
        // Sync player state back to game state (position, velocity, etc.)
        dispatch({
          type: 'UPDATE_PLAYER',
          player: playerRef.current.getState()
        });
      }
      
      // Update difficulty based on elapsed time and player tier
      const newDifficulty = DifficultySystem.calculateDifficulty(
        gameState.elapsedTime,
        gameState.player.tier
      );
      dispatch({
        type: 'UPDATE_DIFFICULTY',
        difficulty: newDifficulty
      });
      
      // Spawn new entities
      if (spawnSystemRef.current) {
        const newEntities = spawnSystemRef.current.update(deltaSeconds, gameState);
        for (const entity of newEntities) {
          dispatch({ type: 'ADD_ENTITY', entity });
          entityManagerRef.current?.addEntity(entity);
        }
      }
      
      // Spawn shark if enabled and not present
      if (gameState.difficulty.sharkEnabled && !sharkRef.current) {
        const shark = new Shark(entityManagerRef.current?.generateId() || 'shark-1');
        sharkRef.current = shark;
        dispatch({ type: 'ADD_ENTITY', entity: shark });
        entityManagerRef.current?.addEntity(shark);
      }
      
      // Update all entities
      if (entityManagerRef.current) {
        entityManagerRef.current.update(deltaSeconds, gameState);
      }
      
      // Update shark separately for state tracking
      if (sharkRef.current && sharkRef.current.active) {
        sharkRef.current.update(deltaSeconds, gameState);
      }
      
      // Check collisions
      const collisions = CollisionSystem.checkCollisions(
        gameState.player,
        gameState.entities
      );
      
      // Handle collision results
      processCollisions(collisions, gameState, dispatch);
      
      // Clean up inactive entities
      const inactiveEntities = gameState.entities.filter((e) => !e.active);
      for (const entity of inactiveEntities) {
        dispatch({ type: 'REMOVE_ENTITY', entityId: entity.id });
        if (entity.type === 'shark') {
          sharkRef.current = null;
        }
      }
    },
    
    onRender: (interpolation: number, gameState: GameState) => {
      const ctx = canvasRef.current?.getContext();
      if (!ctx || !rendererRef.current) return;
      
      rendererRef.current.render(gameState, interpolation);
    }
  });

  // Store dispatch ref for use in callbacks
  useEffect(() => {
    dispatchRef.current = gameLoop.dispatch;
  }, [gameLoop.dispatch]);

  // Handle tap-to-move on canvas
  const handleCanvasTap = useCallback(
    (x: number, y: number) => {
      // Only handle taps during gameplay
      if (gameLoop.gameState.status === 'playing') {
        input.setTapTarget(x, y);
      }
    },
    [gameLoop.gameState.status, input]
  );

  // Use keyboard controls
  useGameControls(gameLoop);
  
  // Use audio events
  useGameAudioEvents(gameLoop.gameState, audio);
  useSharkAudioEvents(gameLoop.gameState.entities, audio);

  // Reset player entity when respawning
  useEffect(() => {
    if (gameLoop.gameState.status === 'respawn' && playerRef.current) {
      gameLogger.log('PLAYER_RESPAWN_CALLED', { 
        playerExists: !!playerRef.current,
        lives: gameLoop.gameState.lives 
      });
      playerRef.current.respawn();
    }
  }, [gameLoop.gameState.status, gameLoop.gameState.lives]);

  // Initialize game systems on canvas ready
  const handleCanvasReady = useCallback((ctx: CanvasRenderingContext2D) => {
    rendererRef.current = new Renderer(ctx);
    spawnSystemRef.current = new SpawnSystem();
    entityManagerRef.current = new EntityManager();
    playerRef.current = new Player(entityManagerRef.current.generateId());
  }, []);

  // Reload high scores on mount (for SSR hydration)
  useEffect(() => {
    const scores = loadHighScores();
    if (scores.length > 0) {
      setHighScores(scores);
    }
  }, []);

  // Initialize audio on first user interaction
  const initializeAudio = useCallback(async () => {
    if (!audioInitialized) {
      await audio.initialize();
      setAudioInitialized(true);
    }
  }, [audio, audioInitialized]);

  // Handle game start
  const handleStart = useCallback(async () => {
    await initializeAudio();
    
    // Start game logger
    gameLogger.start();
    gameLogger.log('GAME_START');
    
    // Reset game systems
    spawnSystemRef.current?.reset();
    entityManagerRef.current?.clear();
    sharkRef.current = null;
    
    // Create new player
    if (entityManagerRef.current) {
      playerRef.current = new Player(entityManagerRef.current.generateId());
    }
    
    gameLoop.startGame();
    audio.playMusic();
  }, [gameLoop, audio, initializeAudio]);

  // Handle game restart
  const handleRestart = useCallback(async () => {
    await initializeAudio();
    
    // Save high score if qualified
    const { score, player } = gameLoop.gameState;
    if (qualifiesForHighScore(score, highScores)) {
      const entry: HighScoreEntry = {
        score,
        tier: player.tier,
        fishEaten: player.fishEaten,
        timestamp: new Date().toISOString()
      };
      saveHighScore(entry);
      setHighScores(loadHighScores());
    }
    
    // Reset game systems
    spawnSystemRef.current?.reset();
    entityManagerRef.current?.clear();
    sharkRef.current = null;
    
    // Create new player
    if (entityManagerRef.current) {
      playerRef.current = new Player(entityManagerRef.current.generateId());
    }
    
    setIsNewHighScore(false);
    gameLoop.restartGame();
    audio.playMusic();
  }, [gameLoop, audio, highScores, initializeAudio]);

  // Handle pause/resume
  const handleResume = useCallback(() => {
    gameLoop.resumeGame();
  }, [gameLoop]);

  // Track previous status to detect game over transition
  const prevStatusRef = useRef(gameLoop.gameState.status);
  
  // Check for new high score when game ends
  useEffect(() => {
    const currentStatus = gameLoop.gameState.status;
    const wasGameOver = prevStatusRef.current !== 'gameover' && currentStatus === 'gameover';
    prevStatusRef.current = currentStatus;
    
    if (wasGameOver) {
      const { score, player } = gameLoop.gameState;
      
      // Save high score
      if (qualifiesForHighScore(score, highScores)) {
        const entry: HighScoreEntry = {
          score,
          tier: player.tier,
          fishEaten: player.fishEaten,
          timestamp: new Date().toISOString()
        };
        saveHighScore(entry);
        // Use callback form to avoid direct setState in effect
        setHighScores(loadHighScores());
        setIsNewHighScore(true);
      }
      
      audio.stopMusic();
    }
  }, [gameLoop.gameState, highScores, audio]);

  const { gameState } = gameLoop;

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Game Canvas */}
      <GameCanvas
        ref={canvasRef}
        onCanvasReady={handleCanvasReady}
        onTap={handleCanvasTap}
        className="w-full h-full"
      />
      
      {/* HUD - Only show during gameplay */}
      {(gameState.status === 'playing' || gameState.status === 'paused') && (
        <HUD
          score={gameState.score}
          highScore={gameState.highScore}
          lives={gameState.lives}
          tier={gameState.player.tier}
          fishEaten={gameState.player.fishEaten}
        />
      )}
      
      {/* Audio Controls - Always visible */}
      <AudioControls
        muted={audio.muted}
        musicVolume={audio.musicVolume}
        sfxVolume={audio.sfxVolume}
        onMuteToggle={audio.setMuted}
        onVolumeChange={audio.setVolume}
      />
      
      {/* Title Screen */}
      {gameState.status === 'title' && (
        <TitleScreen
          highScores={highScores}
          onStart={handleStart}
        />
      )}
      
      {/* Pause Screen */}
      {gameState.status === 'paused' && (
        <PauseScreen
          onResume={handleResume}
          score={gameState.score}
        />
      )}
      
      {/* Game Over Screen */}
      {gameState.status === 'gameover' && (
        <GameOverScreen
          finalScore={gameState.score}
          highScores={highScores}
          isNewHighScore={isNewHighScore}
          finalTier={gameState.player.tier}
          fishEaten={gameState.player.fishEaten}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
