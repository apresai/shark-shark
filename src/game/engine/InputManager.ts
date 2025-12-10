/**
 * InputManager - Handles keyboard and touch input for the game
 * Provides normalized input state and vector calculations
 */

import { InputState, InputVector, InputSource } from '../types';

export class InputManager {
  private keyState: Set<string> = new Set();
  private inputState: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    pause: false,
  };
  private inputSource: InputSource = 'keyboard';
  private isActive = false;
  private touchVector: InputVector = { x: 0, y: 0 };
  private touchDeadzone = 0.1; // Minimum input threshold

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  /**
   * Initialize input listeners
   */
  public initialize(): void {
    if (this.isActive) return;
    
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.isActive = true;
  }

  /**
   * Clean up input listeners
   */
  public destroy(): void {
    if (!this.isActive) return;
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.keyState.clear();
    this.isActive = false;
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.code;
    this.keyState.add(key);
    this.updateInputState();
    
    // Prevent default behavior for game keys
    if (this.isGameKey(key)) {
      event.preventDefault();
    }
  }

  /**
   * Handle keyup events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.code;
    this.keyState.delete(key);
    this.updateInputState();
    
    // Prevent default behavior for game keys
    if (this.isGameKey(key)) {
      event.preventDefault();
    }
  }

  /**
   * Check if a key is a game control key
   */
  private isGameKey(key: string): boolean {
    return [
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'Escape', 'Space', 'Enter'
    ].includes(key);
  }

  /**
   * Update the input state based on current key state
   */
  private updateInputState(): void {
    this.inputState = {
      up: this.keyState.has('KeyW') || this.keyState.has('ArrowUp'),
      down: this.keyState.has('KeyS') || this.keyState.has('ArrowDown'),
      left: this.keyState.has('KeyA') || this.keyState.has('ArrowLeft'),
      right: this.keyState.has('KeyD') || this.keyState.has('ArrowRight'),
      pause: this.keyState.has('Escape'),
    };
    
    // Update input source when keyboard state changes
    this.updateInputSource();
  }

  /**
   * Get current input state
   */
  public getState(): InputState {
    return { ...this.inputState };
  }

  /**
   * Get normalized input vector for 8-directional movement
   */
  public getVector(): InputVector {
    // If touch input is active and above deadzone, use it
    const touchMagnitude = Math.sqrt(this.touchVector.x * this.touchVector.x + this.touchVector.y * this.touchVector.y);
    if (touchMagnitude > this.touchDeadzone) {
      return { ...this.touchVector };
    }

    // Otherwise use keyboard input
    let x = 0;
    let y = 0;

    // Calculate raw direction
    if (this.inputState.left) x -= 1;
    if (this.inputState.right) x += 1;
    if (this.inputState.up) y -= 1;
    if (this.inputState.down) y += 1;

    // Normalize diagonal movement to maintain consistent speed
    if (x !== 0 && y !== 0) {
      const magnitude = Math.sqrt(x * x + y * y);
      x /= magnitude;
      y /= magnitude;
    }

    return { x, y };
  }

  /**
   * Get current input source
   */
  public getSource(): InputSource {
    return this.inputSource;
  }

  /**
   * Set touch input vector (called by VirtualJoystick component)
   */
  public setTouchVector(vector: InputVector): void {
    this.touchVector = { ...vector };
    this.updateInputSource();
  }

  /**
   * Update input source based on current input activity
   */
  private updateInputSource(): void {
    const touchMagnitude = Math.sqrt(this.touchVector.x * this.touchVector.x + this.touchVector.y * this.touchVector.y);
    
    if (touchMagnitude > this.touchDeadzone) {
      this.inputSource = 'touch';
    } else if (this.hasKeyboardInput()) {
      this.inputSource = 'keyboard';
    }
    // If neither touch nor keyboard input is active, keep current source
  }

  /**
   * Check if there's active keyboard input
   */
  private hasKeyboardInput(): boolean {
    return this.inputState.up || this.inputState.down || 
           this.inputState.left || this.inputState.right;
  }

  /**
   * Update method (for future use)
   */
  public update(): void {
    // Currently no per-frame updates needed
    // This method is available for future enhancements
  }
}