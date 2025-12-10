/**
 * Game Logger Utility
 * 
 * Logs game events to console, stores them locally, and sends to server file.
 * Can export logs to a downloadable file.
 */

export interface LogEntry {
  timestamp: number;
  gameTime: number;
  event: string;
  data?: Record<string, unknown>;
}

class GameLogger {
  private logs: LogEntry[] = [];
  private startTime: number = 0;
  private enabled: boolean = true;
  private maxLogs: number = 1000;
  private serverLogging: boolean = true;

  /**
   * Start a new logging session
   */
  start(): void {
    this.logs = [];
    this.startTime = Date.now();
    
    // Clear server log file
    if (this.serverLogging && typeof fetch !== 'undefined') {
      fetch('/api/log', { method: 'DELETE' }).catch(() => {});
    }
    
    this.log('SESSION_START', { startTime: new Date().toISOString() });
  }

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log a game event
   */
  log(event: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const gameTime = (Date.now() - this.startTime) / 1000;
    const entry: LogEntry = {
      timestamp: Date.now(),
      gameTime,
      event,
      data,
    };

    this.logs.push(entry);
    
    // Keep logs bounded
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console with formatting
    const timeStr = entry.gameTime.toFixed(2).padStart(8, ' ');
    if (data) {
      console.log(`[GAME ${timeStr}s] ${event}`, data);
    } else {
      console.log(`[GAME ${timeStr}s] ${event}`);
    }
    
    // Send to server for file logging
    if (this.serverLogging && typeof fetch !== 'undefined') {
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, gameTime }),
      }).catch(() => {});
    }
  }

  /**
   * Log state transitions
   */
  logStateChange(from: string, to: string, reason?: string): void {
    this.log('STATE_CHANGE', { from, to, reason });
  }

  /**
   * Log player events
   */
  logPlayer(event: string, data?: Record<string, unknown>): void {
    this.log(`PLAYER_${event}`, data);
  }

  /**
   * Log collision events
   */
  logCollision(type: string, data?: Record<string, unknown>): void {
    this.log(`COLLISION_${type}`, data);
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Export logs as JSON string
   */
  exportJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Download logs as a file
   */
  downloadLogs(): void {
    const json = this.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Print a summary of recent events to console
   */
  printSummary(): void {
    console.group('Game Log Summary');
    console.log(`Total events: ${this.logs.length}`);
    console.log(`Session duration: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`);
    
    // Count events by type
    const eventCounts: Record<string, number> = {};
    for (const log of this.logs) {
      eventCounts[log.event] = (eventCounts[log.event] || 0) + 1;
    }
    console.log('Event counts:', eventCounts);
    
    // Show last 10 events
    console.log('Last 10 events:');
    for (const log of this.logs.slice(-10)) {
      console.log(`  [${log.gameTime.toFixed(2)}s] ${log.event}`, log.data || '');
    }
    console.groupEnd();
  }
}

// Singleton instance
export const gameLogger = new GameLogger();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as unknown as { gameLogger: GameLogger }).gameLogger = gameLogger;
}
