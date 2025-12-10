/**
 * Unit tests for Math Utilities
 */

import {
  vectorAdd,
  vectorSubtract,
  vectorMultiply,
  vectorMagnitude,
  vectorNormalize,
  clampMagnitude,
  lerp,
  vectorLerp,
  clamp,
  distance,
} from '../../../src/lib/math';

describe('Math Utilities', () => {
  describe('Vector Operations', () => {
    it('should add vectors correctly', () => {
      const a = { x: 3, y: 4 };
      const b = { x: 1, y: 2 };
      const result = vectorAdd(a, b);
      
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('should subtract vectors correctly', () => {
      const a = { x: 5, y: 7 };
      const b = { x: 2, y: 3 };
      const result = vectorSubtract(a, b);
      
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('should multiply vector by scalar correctly', () => {
      const vector = { x: 2, y: 3 };
      const result = vectorMultiply(vector, 2.5);
      
      expect(result.x).toBe(5);
      expect(result.y).toBe(7.5);
    });

    it('should calculate vector magnitude correctly', () => {
      const vector = { x: 3, y: 4 };
      const magnitude = vectorMagnitude(vector);
      
      expect(magnitude).toBe(5);
    });

    it('should normalize vectors correctly', () => {
      const vector = { x: 3, y: 4 };
      const normalized = vectorNormalize(vector);
      
      expect(normalized.x).toBeCloseTo(0.6);
      expect(normalized.y).toBeCloseTo(0.8);
      expect(vectorMagnitude(normalized)).toBeCloseTo(1);
    });

    it('should handle zero vector normalization', () => {
      const vector = { x: 0, y: 0 };
      const normalized = vectorNormalize(vector);
      
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
    });

    it('should clamp vector magnitude correctly', () => {
      const vector = { x: 10, y: 0 };
      const clamped = clampMagnitude(vector, 5);
      
      expect(clamped.x).toBe(5);
      expect(clamped.y).toBe(0);
      expect(vectorMagnitude(clamped)).toBe(5);
    });

    it('should not clamp vector if already within limit', () => {
      const vector = { x: 3, y: 4 };
      const clamped = clampMagnitude(vector, 10);
      
      expect(clamped.x).toBe(3);
      expect(clamped.y).toBe(4);
    });
  });

  describe('Interpolation', () => {
    it('should interpolate between numbers correctly', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('should interpolate between vectors correctly', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 20 };
      const result = vectorLerp(a, b, 0.5);
      
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
    });
  });

  describe('Utility Functions', () => {
    it('should clamp values correctly', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should calculate distance correctly', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 3, y: 4 };
      const dist = distance(a, b);
      
      expect(dist).toBe(5);
    });
  });
});