/**
 * API Route for saving game logs to disk
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'game-logs');
const LOG_FILE = path.join(LOG_DIR, 'game.log');

export async function POST(request: NextRequest) {
  try {
    const { event, data, gameTime } = await request.json();
    
    // Ensure log directory exists
    if (!existsSync(LOG_DIR)) {
      await mkdir(LOG_DIR, { recursive: true });
    }
    
    // Format log entry
    const timestamp = new Date().toISOString();
    const timeStr = typeof gameTime === 'number' ? gameTime.toFixed(2).padStart(8, ' ') : '    0.00';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    const logLine = `[${timestamp}] [${timeStr}s] ${event}${dataStr}\n`;
    
    // Append to log file
    await appendFile(LOG_FILE, logLine);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to write log:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Clear the log file
    if (!existsSync(LOG_DIR)) {
      await mkdir(LOG_DIR, { recursive: true });
    }
    
    const header = `=== Game Log Started ${new Date().toISOString()} ===\n`;
    await writeFile(LOG_FILE, header);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear log:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
