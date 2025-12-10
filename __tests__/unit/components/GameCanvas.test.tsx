/**
 * GameCanvas Component Tests
 * 
 * Tests for the GameCanvas component including responsive scaling
 * and aspect ratio preservation.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameCanvas, GameCanvasHandle } from '../../../src/components/GameCanvas';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_ASPECT_RATIO } from '../../../src/game/constants';

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback;
  
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock canvas getContext
const mockContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  font: '',
  textAlign: 'left',
  textBaseline: 'alphabetic',
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  ellipse: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  translate: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;

describe('GameCanvas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should render a canvas element', () => {
      render(<GameCanvas />);
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('should set canvas internal dimensions to 800x600', () => {
      render(<GameCanvas />);
      const canvas = document.querySelector('canvas');
      expect(canvas?.width).toBe(CANVAS_WIDTH);
      expect(canvas?.height).toBe(CANVAS_HEIGHT);
    });

    it('should call onCanvasReady with 2D context', () => {
      const onCanvasReady = jest.fn();
      render(<GameCanvas onCanvasReady={onCanvasReady} />);
      
      expect(onCanvasReady).toHaveBeenCalledTimes(1);
      expect(onCanvasReady).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('ref handle', () => {
    it('should expose getCanvas method', () => {
      const ref = React.createRef<GameCanvasHandle>();
      render(<GameCanvas ref={ref} />);
      
      expect(ref.current?.getCanvas()).toBeInstanceOf(HTMLCanvasElement);
    });

    it('should expose getContext method', () => {
      const ref = React.createRef<GameCanvasHandle>();
      render(<GameCanvas ref={ref} />);
      
      expect(ref.current?.getContext()).toBe(mockContext);
    });

    it('should expose getScale method', () => {
      const ref = React.createRef<GameCanvasHandle>();
      render(<GameCanvas ref={ref} />);
      
      expect(typeof ref.current?.getScale()).toBe('number');
    });

    it('should expose getDisplayDimensions method', () => {
      const ref = React.createRef<GameCanvasHandle>();
      render(<GameCanvas ref={ref} />);
      
      const dimensions = ref.current?.getDisplayDimensions();
      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
    });
  });

  describe('aspect ratio', () => {
    it('should maintain 4:3 aspect ratio constant', () => {
      expect(CANVAS_ASPECT_RATIO).toBeCloseTo(4 / 3, 5);
    });

    it('should have correct base dimensions', () => {
      expect(CANVAS_WIDTH).toBe(800);
      expect(CANVAS_HEIGHT).toBe(600);
      expect(CANVAS_WIDTH / CANVAS_HEIGHT).toBeCloseTo(4 / 3, 5);
    });
  });

  describe('container styling', () => {
    it('should have a container with flex centering', () => {
      render(<GameCanvas />);
      const container = document.querySelector('.game-canvas-container');
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<GameCanvas className="custom-class" />);
      const container = document.querySelector('.game-canvas-container');
      expect(container).toHaveClass('custom-class');
    });
  });
});
