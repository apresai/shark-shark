/**
 * Unit tests for Scoring System
 */

import { ScoringSystem } from '../../../src/game/systems/ScoringSystem';
import { FishEntity, HighScoreTable } from '../../../src/game/types';
import { FISH_POINTS, SHARK_CONFIG, SEAHORSE_CONFIG } from '../../../src/game/constants';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ScoringSystem', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('calculateFishPoints', () => {
    const createFish = (size: 'tiny' | 'small' | 'medium' | 'large' | 'giant'): FishEntity => ({
      id: 'test-fish',
      type: 'fish',
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      width: 20,
      height: 15,
      active: true,
      size,
      points: FISH_POINTS[size],
      update: jest.fn(),
      render: jest.fn(),
      getBoundingBox: jest.fn(),
    });

    it('should calculate points with tier multiplier for tiny fish', () => {
      const fish = createFish('tiny');
      expect(ScoringSystem.calculateFishPoints(fish, 1)).toBe(10); // 10 * 1
      expect(ScoringSystem.calculateFishPoints(fish, 3)).toBe(30); // 10 * 3
      expect(ScoringSystem.calculateFishPoints(fish, 5)).toBe(50); // 10 * 5
    });

    it('should calculate points with tier multiplier for small fish', () => {
      const fish = createFish('small');
      expect(ScoringSystem.calculateFishPoints(fish, 1)).toBe(25); // 25 * 1
      expect(ScoringSystem.calculateFishPoints(fish, 2)).toBe(50); // 25 * 2
    });

    it('should calculate points with tier multiplier for medium fish', () => {
      const fish = createFish('medium');
      expect(ScoringSystem.calculateFishPoints(fish, 1)).toBe(50); // 50 * 1
      expect(ScoringSystem.calculateFishPoints(fish, 4)).toBe(200); // 50 * 4
    });

    it('should calculate points with tier multiplier for large fish', () => {
      const fish = createFish('large');
      expect(ScoringSystem.calculateFishPoints(fish, 2)).toBe(200); // 100 * 2
      expect(ScoringSystem.calculateFishPoints(fish, 5)).toBe(500); // 100 * 5
    });

    it('should calculate points with tier multiplier for giant fish', () => {
      const fish = createFish('giant');
      expect(ScoringSystem.calculateFishPoints(fish, 1)).toBe(200); // 200 * 1
      expect(ScoringSystem.calculateFishPoints(fish, 3)).toBe(600); // 200 * 3
    });
  });

  describe('getSharkTailPoints', () => {
    it('should return flat 500 points for shark tail', () => {
      expect(ScoringSystem.getSharkTailPoints()).toBe(SHARK_CONFIG.tailPoints);
      expect(ScoringSystem.getSharkTailPoints()).toBe(500);
    });
  });

  describe('getSeahorsePoints', () => {
    it('should return flat 200 points for seahorse', () => {
      expect(ScoringSystem.getSeahorsePoints()).toBe(SEAHORSE_CONFIG.points);
      expect(ScoringSystem.getSeahorsePoints()).toBe(200);
    });
  });

  describe('checkExtraLifeThresholds', () => {
    it('should return 0 extra lives when no thresholds crossed', () => {
      expect(ScoringSystem.checkExtraLifeThresholds(5000, 8000)).toBe(0);
      expect(ScoringSystem.checkExtraLifeThresholds(15000, 25000)).toBe(0);
    });

    it('should return 1 extra life when crossing single threshold', () => {
      expect(ScoringSystem.checkExtraLifeThresholds(8000, 12000)).toBe(1); // Cross 10k
      expect(ScoringSystem.checkExtraLifeThresholds(25000, 35000)).toBe(1); // Cross 30k
      expect(ScoringSystem.checkExtraLifeThresholds(55000, 65000)).toBe(1); // Cross 60k
      expect(ScoringSystem.checkExtraLifeThresholds(95000, 105000)).toBe(1); // Cross 100k
    });

    it('should return multiple extra lives when crossing multiple thresholds', () => {
      expect(ScoringSystem.checkExtraLifeThresholds(5000, 35000)).toBe(2); // Cross 10k and 30k
      expect(ScoringSystem.checkExtraLifeThresholds(8000, 65000)).toBe(3); // Cross 10k, 30k, and 60k
      expect(ScoringSystem.checkExtraLifeThresholds(0, 105000)).toBe(4); // Cross all initial thresholds
    });

    it('should handle 50k intervals after 100k correctly', () => {
      expect(ScoringSystem.checkExtraLifeThresholds(120000, 160000)).toBe(1); // Cross 150k
      expect(ScoringSystem.checkExtraLifeThresholds(140000, 210000)).toBe(2); // Cross 150k and 200k
      expect(ScoringSystem.checkExtraLifeThresholds(120000, 220000)).toBe(2); // Cross 150k and 200k
      expect(ScoringSystem.checkExtraLifeThresholds(180000, 210000)).toBe(1); // Cross 200k only
    });

    it('should handle crossing 100k and subsequent intervals', () => {
      expect(ScoringSystem.checkExtraLifeThresholds(95000, 160000)).toBe(2); // Cross 100k and 150k
      expect(ScoringSystem.checkExtraLifeThresholds(80000, 210000)).toBe(3); // Cross 100k, 150k, and 200k
    });

    it('should handle edge cases correctly', () => {
      expect(ScoringSystem.checkExtraLifeThresholds(10000, 10000)).toBe(0); // Same score
      expect(ScoringSystem.checkExtraLifeThresholds(10000, 9999)).toBe(0); // Score decrease
      expect(ScoringSystem.checkExtraLifeThresholds(9999, 10000)).toBe(1); // Exact threshold cross
    });
  });

  describe('loadHighScores', () => {
    it('should return empty table when no data in localStorage', () => {
      const result = ScoringSystem.loadHighScores();
      expect(result.entries).toEqual([]);
    });

    it('should load and sort high scores from localStorage', () => {
      const testData: HighScoreTable = {
        entries: [
          { score: 5000, tier: 2, fishEaten: 10, timestamp: '2023-01-01T00:00:00.000Z' },
          { score: 15000, tier: 3, fishEaten: 25, timestamp: '2023-01-02T00:00:00.000Z' },
          { score: 8000, tier: 2, fishEaten: 15, timestamp: '2023-01-03T00:00:00.000Z' },
        ],
      };
      
      localStorageMock.setItem('sharkshark_highscores', JSON.stringify(testData));
      
      const result = ScoringSystem.loadHighScores();
      
      expect(result.entries).toHaveLength(3);
      expect(result.entries[0].score).toBe(15000); // Highest first
      expect(result.entries[1].score).toBe(8000);
      expect(result.entries[2].score).toBe(5000); // Lowest last
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageMock.setItem('sharkshark_highscores', 'invalid json');
      
      const result = ScoringSystem.loadHighScores();
      
      expect(result.entries).toEqual([]);
    });

    it('should filter out invalid entries', () => {
      const testData = {
        entries: [
          { score: 5000, tier: 2, fishEaten: 10, timestamp: '2023-01-01T00:00:00.000Z' },
          { score: 'invalid', tier: 2, fishEaten: 10, timestamp: '2023-01-01T00:00:00.000Z' },
          { score: 8000, tier: 2, fishEaten: 15, timestamp: '2023-01-03T00:00:00.000Z' },
        ],
      };
      
      localStorageMock.setItem('sharkshark_highscores', JSON.stringify(testData));
      
      const result = ScoringSystem.loadHighScores();
      
      expect(result.entries).toHaveLength(2);
      expect(result.entries.every(entry => typeof entry.score === 'number')).toBe(true);
    });

    it('should limit entries to maximum allowed', () => {
      const testData: HighScoreTable = {
        entries: Array.from({ length: 15 }, (_, i) => ({
          score: (15 - i) * 1000,
          tier: 2,
          fishEaten: 10,
          timestamp: '2023-01-01T00:00:00.000Z',
        })),
      };
      
      localStorageMock.setItem('sharkshark_highscores', JSON.stringify(testData));
      
      const result = ScoringSystem.loadHighScores();
      
      expect(result.entries).toHaveLength(10); // Should be limited to 10
      expect(result.entries[0].score).toBe(15000); // Highest score first
    });
  });

  describe('saveHighScores', () => {
    it('should save high scores to localStorage', () => {
      const testData: HighScoreTable = {
        entries: [
          { score: 15000, tier: 3, fishEaten: 25, timestamp: '2023-01-01T00:00:00.000Z' },
          { score: 8000, tier: 2, fishEaten: 15, timestamp: '2023-01-02T00:00:00.000Z' },
        ],
      };
      
      ScoringSystem.saveHighScores(testData);
      
      const stored = localStorageMock.getItem('sharkshark_highscores');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.entries).toHaveLength(2);
      expect(parsed.entries[0].score).toBe(15000);
    });

    it('should sort entries before saving', () => {
      const testData: HighScoreTable = {
        entries: [
          { score: 5000, tier: 2, fishEaten: 10, timestamp: '2023-01-01T00:00:00.000Z' },
          { score: 15000, tier: 3, fishEaten: 25, timestamp: '2023-01-02T00:00:00.000Z' },
          { score: 8000, tier: 2, fishEaten: 15, timestamp: '2023-01-03T00:00:00.000Z' },
        ],
      };
      
      ScoringSystem.saveHighScores(testData);
      
      const stored = localStorageMock.getItem('sharkshark_highscores');
      const parsed = JSON.parse(stored!);
      
      expect(parsed.entries[0].score).toBe(15000);
      expect(parsed.entries[1].score).toBe(8000);
      expect(parsed.entries[2].score).toBe(5000);
    });

    it('should limit entries to maximum before saving', () => {
      const testData: HighScoreTable = {
        entries: Array.from({ length: 15 }, (_, i) => ({
          score: (15 - i) * 1000,
          tier: 2,
          fishEaten: 10,
          timestamp: '2023-01-01T00:00:00.000Z',
        })),
      };
      
      ScoringSystem.saveHighScores(testData);
      
      const stored = localStorageMock.getItem('sharkshark_highscores');
      const parsed = JSON.parse(stored!);
      
      expect(parsed.entries).toHaveLength(10);
    });
  });

  describe('qualifiesForHighScore', () => {
    it('should return true when table has fewer than max entries', () => {
      const highScores: HighScoreTable = {
        entries: [
          { score: 5000, tier: 2, fishEaten: 10, timestamp: '2023-01-01T00:00:00.000Z' },
        ],
      };
      
      expect(ScoringSystem.qualifiesForHighScore(1000, highScores)).toBe(true);
      expect(ScoringSystem.qualifiesForHighScore(10000, highScores)).toBe(true);
    });

    it('should return true when score is higher than lowest entry', () => {
      const highScores: HighScoreTable = {
        entries: Array.from({ length: 10 }, (_, i) => ({
          score: (10 - i) * 1000, // 10000, 9000, ..., 1000
          tier: 2,
          fishEaten: 10,
          timestamp: '2023-01-01T00:00:00.000Z',
        })),
      };
      
      expect(ScoringSystem.qualifiesForHighScore(1500, highScores)).toBe(true);
      expect(ScoringSystem.qualifiesForHighScore(5000, highScores)).toBe(true);
    });

    it('should return false when score is not higher than lowest entry', () => {
      const highScores: HighScoreTable = {
        entries: Array.from({ length: 10 }, (_, i) => ({
          score: (10 - i) * 1000, // 10000, 9000, ..., 1000
          tier: 2,
          fishEaten: 10,
          timestamp: '2023-01-01T00:00:00.000Z',
        })),
      };
      
      expect(ScoringSystem.qualifiesForHighScore(500, highScores)).toBe(false);
      expect(ScoringSystem.qualifiesForHighScore(1000, highScores)).toBe(false); // Equal to lowest
    });
  });

  describe('addHighScore', () => {
    it('should add new entry and maintain sort order', () => {
      const highScores: HighScoreTable = {
        entries: [
          { score: 10000, tier: 3, fishEaten: 20, timestamp: '2023-01-01T00:00:00.000Z' },
          { score: 5000, tier: 2, fishEaten: 10, timestamp: '2023-01-02T00:00:00.000Z' },
        ],
      };
      
      const result = ScoringSystem.addHighScore(7500, 3, 15, highScores);
      
      expect(result.entries).toHaveLength(3);
      expect(result.entries[0].score).toBe(10000);
      expect(result.entries[1].score).toBe(7500); // New entry in correct position
      expect(result.entries[2].score).toBe(5000);
    });

    it('should limit entries to maximum when adding', () => {
      const highScores: HighScoreTable = {
        entries: Array.from({ length: 10 }, (_, i) => ({
          score: (10 - i) * 1000,
          tier: 2,
          fishEaten: 10,
          timestamp: '2023-01-01T00:00:00.000Z',
        })),
      };
      
      const result = ScoringSystem.addHighScore(15000, 4, 30, highScores);
      
      expect(result.entries).toHaveLength(10); // Still limited to 10
      expect(result.entries[0].score).toBe(15000); // New highest score
      expect(result.entries[9].score).toBe(2000); // Lowest entry was removed
    });

    it('should create proper timestamp for new entry', () => {
      const highScores: HighScoreTable = { entries: [] };
      
      const result = ScoringSystem.addHighScore(5000, 2, 10, highScores);
      
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('persistHighScore', () => {
    it('should return true and save when score qualifies', () => {
      const result = ScoringSystem.persistHighScore(5000, 2, 10);
      
      expect(result).toBe(true);
      
      const stored = localStorageMock.getItem('sharkshark_highscores');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.entries).toHaveLength(1);
      expect(parsed.entries[0].score).toBe(5000);
    });

    it('should return false when score does not qualify', () => {
      // First, populate with 10 high scores
      const highScores: HighScoreTable = {
        entries: Array.from({ length: 10 }, (_, i) => ({
          score: (10 - i) * 1000, // 10000 down to 1000
          tier: 2,
          fishEaten: 10,
          timestamp: '2023-01-01T00:00:00.000Z',
        })),
      };
      ScoringSystem.saveHighScores(highScores);
      
      const result = ScoringSystem.persistHighScore(500, 1, 5);
      
      expect(result).toBe(false);
      
      // Verify the table wasn't modified
      const loaded = ScoringSystem.loadHighScores();
      expect(loaded.entries).toHaveLength(10);
      expect(loaded.entries.some(entry => entry.score === 500)).toBe(false);
    });
  });
});