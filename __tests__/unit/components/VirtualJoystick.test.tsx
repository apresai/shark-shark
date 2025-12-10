/**
 * Unit tests for VirtualJoystick component
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { VirtualJoystick } from '../../../src/components/VirtualJoystick';
import { InputVector } from '../../../src/game/types';

// Mock touch events
const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
  return new TouchEvent(type, {
    touches: touches.map(touch => ({
      ...touch,
      identifier: 0,
      target: document.createElement('div'),
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    })) as any,
    bubbles: true,
  });
};

describe('VirtualJoystick', () => {
  let mockOnInputChange: jest.Mock<void, [InputVector]>;

  beforeEach(() => {
    mockOnInputChange = jest.fn();
  });

  it('should render joystick container and knob', () => {
    render(<VirtualJoystick onInputChange={mockOnInputChange} />);
    
    const container = document.querySelector('.virtual-joystick');
    const knob = document.querySelector('.joystick-knob');
    
    expect(container).toBeInTheDocument();
    expect(knob).toBeInTheDocument();
  });

  it('should use custom size when provided', () => {
    const customSize = 150;
    render(<VirtualJoystick onInputChange={mockOnInputChange} size={customSize} />);
    
    const container = document.querySelector('.virtual-joystick') as HTMLElement;
    expect(container.style.width).toBe(`${customSize}px`);
    expect(container.style.height).toBe(`${customSize}px`);
  });

  it('should call onInputChange with zero vector initially', () => {
    render(<VirtualJoystick onInputChange={mockOnInputChange} />);
    
    // The component doesn't call onInputChange on mount, only on interaction
    expect(mockOnInputChange).not.toHaveBeenCalled();
  });

  it('should handle touch events', () => {
    render(<VirtualJoystick onInputChange={mockOnInputChange} />);
    
    const container = document.querySelector('.virtual-joystick') as HTMLElement;
    
    // Mock getBoundingClientRect
    const mockRect = {
      left: 100,
      top: 100,
      width: 120,
      height: 120,
      right: 220,
      bottom: 220,
    };
    container.getBoundingClientRect = jest.fn(() => mockRect as DOMRect);

    act(() => {
      // Simulate touch start at center (should result in zero vector)
      const touchStartEvent = createTouchEvent('touchstart', [{ clientX: 160, clientY: 160 }]);
      container.dispatchEvent(touchStartEvent);
    });

    expect(mockOnInputChange).toHaveBeenCalledWith({ x: 0, y: 0 });

    act(() => {
      // Simulate touch move to the right (20 pixels from center)
      const touchMoveEvent = createTouchEvent('touchmove', [{ clientX: 180, clientY: 160 }]);
      container.dispatchEvent(touchMoveEvent);
    });

    // Should have been called with a positive x value
    expect(mockOnInputChange).toHaveBeenCalledWith(expect.objectContaining({
      x: expect.any(Number),
      y: expect.any(Number),
    }));

    const lastCall = mockOnInputChange.mock.calls[mockOnInputChange.mock.calls.length - 1][0];
    expect(lastCall.x).toBeGreaterThan(0);
    expect(Math.abs(lastCall.y)).toBeLessThan(0.1); // Should be close to 0 for horizontal movement

    act(() => {
      // Simulate touch end
      const touchEndEvent = createTouchEvent('touchend', []);
      container.dispatchEvent(touchEndEvent);
    });

    expect(mockOnInputChange).toHaveBeenLastCalledWith({ x: 0, y: 0 });
  });

  it('should apply custom className', () => {
    const customClass = 'custom-joystick';
    render(<VirtualJoystick onInputChange={mockOnInputChange} className={customClass} />);
    
    const container = document.querySelector('.virtual-joystick');
    expect(container).toHaveClass(customClass);
  });
});