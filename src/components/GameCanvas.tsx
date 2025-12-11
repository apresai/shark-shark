/**
 * GameCanvas Component
 * 
 * Provides the main canvas element for game rendering with responsive scaling
 * that maintains the 800x600 (4:3) aspect ratio.
 * 
 * Requirements: 11.4 - Canvas SHALL scale proportionally while maintaining 800x600 aspect ratio
 */

'use client';

import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_ASPECT_RATIO } from '../game/constants';

export interface GameCanvasProps {
  /** Callback when canvas is ready with 2D context */
  onCanvasReady?: (ctx: CanvasRenderingContext2D) => void;
  /** Callback when canvas resizes */
  onResize?: (width: number, height: number, scale: number) => void;
  /** Callback when user taps on canvas (game coordinates) */
  onTap?: (x: number, y: number) => void;
  /** Additional CSS class names */
  className?: string;
}

export interface GameCanvasHandle {
  /** Get the canvas element */
  getCanvas: () => HTMLCanvasElement | null;
  /** Get the 2D rendering context */
  getContext: () => CanvasRenderingContext2D | null;
  /** Get the current scale factor */
  getScale: () => number;
  /** Get the current display dimensions */
  getDisplayDimensions: () => { width: number; height: number };
}

/**
 * Calculate scaled dimensions that maintain aspect ratio
 */
function calculateScaledDimensions(
  containerWidth: number,
  containerHeight: number
): { width: number; height: number; scale: number } {
  // Calculate scale to fit container while maintaining aspect ratio
  const scaleX = containerWidth / CANVAS_WIDTH;
  const scaleY = containerHeight / CANVAS_HEIGHT;
  const scale = Math.min(scaleX, scaleY);

  return {
    width: Math.floor(CANVAS_WIDTH * scale),
    height: Math.floor(CANVAS_HEIGHT * scale),
    scale,
  };
}


export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  function GameCanvas({ onCanvasReady, onResize, onTap, className = '' }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [displayDimensions, setDisplayDimensions] = useState({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
    const [scale, setScale] = useState(1);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      getContext: () => contextRef.current,
      getScale: () => scale,
      getDisplayDimensions: () => displayDimensions,
    }));

    /**
     * Handle container resize and update canvas display size
     */
    const handleResize = useCallback(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const containerRect = container.getBoundingClientRect();
      const { width, height, scale: newScale } = calculateScaledDimensions(
        containerRect.width,
        containerRect.height
      );

      // Update display dimensions (CSS size)
      setDisplayDimensions({ width, height });
      setScale(newScale);

      // Notify parent of resize
      onResize?.(width, height, newScale);
    }, [onResize]);

    /**
     * Initialize canvas context
     */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get 2D rendering context
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D rendering context');
        return;
      }

      contextRef.current = ctx;

      // Notify parent that canvas is ready
      onCanvasReady?.(ctx);
    }, [onCanvasReady]);

    /**
     * Convert screen coordinates to game coordinates
     */
    const screenToGameCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      const y = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

      // Clamp to canvas bounds
      return {
        x: Math.max(0, Math.min(CANVAS_WIDTH, x)),
        y: Math.max(0, Math.min(CANVAS_HEIGHT, y))
      };
    }, []);

    /**
     * Handle touch/click events for tap-to-move
     */
    const handleTap = useCallback((clientX: number, clientY: number) => {
      const coords = screenToGameCoords(clientX, clientY);
      if (coords && onTap) {
        onTap(coords.x, coords.y);
      }
    }, [screenToGameCoords, onTap]);

    /**
     * Set up resize observer
     */
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Initial resize
      handleResize();

      // Set up ResizeObserver for responsive scaling
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      resizeObserver.observe(container);

      // Also listen to window resize as fallback
      window.addEventListener('resize', handleResize);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
      };
    }, [handleResize]);

    /**
     * Set up touch event handlers to prevent scrolling and handle taps
     */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Prevent default touch behavior (scrolling, zooming)
      const preventScroll = (e: TouchEvent) => {
        e.preventDefault();
      };

      // Handle touch start for tap-to-move
      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          handleTap(touch.clientX, touch.clientY);
        }
      };

      // Handle touch move (continuous movement while dragging)
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1) {
          const touch = e.touches[0];
          handleTap(touch.clientX, touch.clientY);
        }
      };

      // Handle mouse click for desktop tap-to-move (optional)
      const handleClick = (e: MouseEvent) => {
        handleTap(e.clientX, e.clientY);
      };

      // Add passive: false to allow preventDefault
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', preventScroll, { passive: false });
      canvas.addEventListener('click', handleClick);

      return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', preventScroll);
        canvas.removeEventListener('click', handleClick);
      };
    }, [handleTap]);

    return (
      <div
        ref={containerRef}
        className={`game-canvas-container ${className}`}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#001428', // Deep ocean blue background
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            width: displayDimensions.width,
            height: displayDimensions.height,
            imageRendering: 'pixelated', // Crisp pixel art rendering
          }}
        />
      </div>
    );
  }
);

export default GameCanvas;
