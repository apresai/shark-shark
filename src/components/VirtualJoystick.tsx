/**
 * VirtualJoystick - Touch-based input control for mobile devices
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { InputVector } from '../game/types';

interface VirtualJoystickProps {
  onInputChange: (vector: InputVector) => void;
  size?: number;
  className?: string;
}

interface TouchState {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onInputChange,
  size = 120,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [touchState, setTouchState] = useState<TouchState>({
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const maxDistance = size / 2 - 20; // Leave some padding

  const calculateInputVector = useCallback((centerX: number, centerY: number, touchX: number, touchY: number): InputVector => {
    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance === 0) {
      return { x: 0, y: 0 };
    }

    // Clamp to max distance
    const clampedDistance = Math.min(distance, maxDistance);
    const normalizedX = (deltaX / distance) * (clampedDistance / maxDistance);
    const normalizedY = (deltaY / distance) * (clampedDistance / maxDistance);

    return { x: normalizedX, y: normalizedY };
  }, [maxDistance]);

  const updateKnobPosition = useCallback((centerX: number, centerY: number, touchX: number, touchY: number) => {
    if (!knobRef.current) return;

    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    let knobX = deltaX;
    let knobY = deltaY;

    // Clamp knob position to circle boundary
    if (distance > maxDistance) {
      knobX = (deltaX / distance) * maxDistance;
      knobY = (deltaY / distance) * maxDistance;
    }

    knobRef.current.style.transform = `translate(${knobX}px, ${knobY}px)`;
  }, [maxDistance]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    event.preventDefault();
    if (!containerRef.current) return;

    const touch = event.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setTouchState({
      isActive: true,
      startX: centerX,
      startY: centerY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });

    const vector = calculateInputVector(centerX, centerY, touch.clientX, touch.clientY);
    onInputChange(vector);
    updateKnobPosition(centerX, centerY, touch.clientX, touch.clientY);
  }, [calculateInputVector, onInputChange, updateKnobPosition]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    event.preventDefault();
    if (!touchState.isActive) return;

    const touch = event.touches[0];
    const vector = calculateInputVector(touchState.startX, touchState.startY, touch.clientX, touch.clientY);
    onInputChange(vector);
    updateKnobPosition(touchState.startX, touchState.startY, touch.clientX, touch.clientY);

    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));
  }, [touchState.isActive, touchState.startX, touchState.startY, calculateInputVector, onInputChange, updateKnobPosition]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    event.preventDefault();
    
    setTouchState({
      isActive: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });

    onInputChange({ x: 0, y: 0 });

    // Reset knob position
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)';
    }
  }, [onInputChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      className={`virtual-joystick ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        border: '2px solid rgba(255, 255, 255, 0.4)',
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <div
        ref={knobRef}
        className="joystick-knob"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          border: '2px solid rgba(255, 255, 255, 1)',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          transition: touchState.isActive ? 'none' : 'transform 0.2s ease-out',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};