/**
 * GameOverScreen Component Tests
 * 
 * Tests for the GameOverScreen component including high scores scrollability
 * and element ordering.
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameOverScreen } from '../../../src/components/GameOverScreen';
import type { HighScoreEntry } from '../../../src/game/types';

// Mock useWindowSize hook
jest.mock('../../../src/hooks/useWindowSize', () => ({
  useWindowSize: () => ({
    width: 1024,
    height: 768,
    isMobile: false,
  }),
}));

describe('GameOverScreen', () => {
  const mockHighScores: HighScoreEntry[] = [
    { score: 1000, tier: 3, timestamp: '2024-01-01T00:00:00Z' },
    { score: 800, tier: 2, timestamp: '2024-01-02T00:00:00Z' },
    { score: 600, tier: 2, timestamp: '2024-01-03T00:00:00Z' },
  ];

  const defaultProps = {
    finalScore: 500,
    highScores: mockHighScores,
    isNewHighScore: false,
    finalTier: 2,
    fishEaten: 25,
    onRestart: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('high scores scrollability', () => {
    it('should have maxHeight set on highScoresSection', () => {
      render(<GameOverScreen {...defaultProps} />);
      
      // Find the high scores section by its title
      const highScoresTitle = screen.getByText('HIGH SCORES');
      const highScoresSection = highScoresTitle.parentElement;
      
      expect(highScoresSection).toHaveStyle({ maxHeight: '30vh' });
    });

    it('should have overflowY auto on highScoresList', () => {
      render(<GameOverScreen {...defaultProps} />);
      
      // Find the high scores list container (parent of score entries)
      const firstScoreEntry = screen.getByText('1,000');
      const highScoresList = firstScoreEntry.parentElement?.parentElement;
      
      expect(highScoresList).toHaveStyle({ overflowY: 'auto' });
    });

    it('should render button before high scores in DOM order', () => {
      const { container } = render(<GameOverScreen {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: 'PLAY AGAIN' });
      const highScoresTitle = screen.getByText('HIGH SCORES');
      
      // Get all elements in the container
      const allElements = container.querySelectorAll('*');
      const elementsArray = Array.from(allElements);
      
      const buttonIndex = elementsArray.indexOf(button);
      const highScoresIndex = elementsArray.indexOf(highScoresTitle);
      
      expect(buttonIndex).toBeLessThan(highScoresIndex);
    });
  });
});
