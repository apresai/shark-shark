/**
 * useInput - React hook for managing game input
 */

import { useEffect, useRef, useCallback } from 'react';
import { InputManager } from '../game/engine/InputManager';
import { InputState, InputVector, InputSource } from '../game/types';

export interface UseInputReturn {
  inputManager: InputManager;
  getState: () => InputState;
  getVector: () => InputVector;
  getSource: () => InputSource;
  setTouchVector: (vector: InputVector) => void;
}

export const useInput = (): UseInputReturn => {
  const inputManagerRef = useRef<InputManager | null>(null);

  // Initialize InputManager
  useEffect(() => {
    if (!inputManagerRef.current) {
      inputManagerRef.current = new InputManager();
      inputManagerRef.current.initialize();
    }

    return () => {
      if (inputManagerRef.current) {
        inputManagerRef.current.destroy();
        inputManagerRef.current = null;
      }
    };
  }, []);

  const getState = useCallback((): InputState => {
    return inputManagerRef.current?.getState() ?? {
      up: false,
      down: false,
      left: false,
      right: false,
      pause: false,
    };
  }, []);

  const getVector = useCallback((): InputVector => {
    return inputManagerRef.current?.getVector() ?? { x: 0, y: 0 };
  }, []);

  const getSource = useCallback((): InputSource => {
    return inputManagerRef.current?.getSource() ?? 'keyboard';
  }, []);

  const setTouchVector = useCallback((vector: InputVector): void => {
    inputManagerRef.current?.setTouchVector(vector);
  }, []);

  return {
    inputManager: inputManagerRef.current!,
    getState,
    getVector,
    getSource,
    setTouchVector,
  };
};