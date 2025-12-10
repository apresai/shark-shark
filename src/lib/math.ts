/**
 * Math Utilities for Shark Shark
 * Vector operations, interpolation, and physics calculations
 */

import { Vector2D } from '@/game/types';

// =============================================================================
// Vector Operations
// =============================================================================

/**
 * Add two vectors
 */
export function vectorAdd(a: Vector2D, b: Vector2D): Vector2D {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

/**
 * Subtract vector b from vector a
 */
export function vectorSubtract(a: Vector2D, b: Vector2D): Vector2D {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

/**
 * Multiply vector by scalar
 */
export function vectorMultiply(vector: Vector2D, scalar: number): Vector2D {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
  };
}

/**
 * Calculate the magnitude (length) of a vector
 */
export function vectorMagnitude(vector: Vector2D): number {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

/**
 * Normalize a vector to unit length
 * Returns zero vector if input magnitude is zero
 */
export function vectorNormalize(vector: Vector2D): Vector2D {
  const magnitude = vectorMagnitude(vector);
  
  if (magnitude === 0) {
    return { x: 0, y: 0 };
  }
  
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
}

/**
 * Clamp vector magnitude to maximum value
 * If magnitude exceeds max, scale vector down to max length
 */
export function clampMagnitude(vector: Vector2D, maxMagnitude: number): Vector2D {
  const magnitude = vectorMagnitude(vector);
  
  if (magnitude <= maxMagnitude) {
    return vector;
  }
  
  const normalized = vectorNormalize(vector);
  return vectorMultiply(normalized, maxMagnitude);
}

// =============================================================================
// Interpolation
// =============================================================================

/**
 * Linear interpolation between two values
 * @param a Start value
 * @param b End value  
 * @param t Interpolation factor (0 to 1)
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Linear interpolation between two vectors
 */
export function vectorLerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate distance between two points
 */
export function distance(a: Vector2D, b: Vector2D): number {
  return vectorMagnitude(vectorSubtract(b, a));
}