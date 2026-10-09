/**
 * API route for game event logs.
 *
 * Local dev appends to game-logs/game.log (gitignored). On Lambda, /var/task
 * is read-only, so mkdir there returns 500. Those requests write one JSON
 * line to stdout instead, which CloudWatch already collects.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'game-logs');
const LOG_FILE = path.join(LOG_DIR, 'game.log');

function onLambda(): boolean {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function writeStdout(entry: {
  event: unknown;
  gameTime?: number | null;
  data?: unknown;
}): void {
  console.log(JSON.stringify({
    source: 'game-log',
    timestamp: new Date().toISOString(),
    event: entry.event,
    gameTime: entry.gameTime ?? null,
    data: entry.data ?? null,
  }));
}

export async function POST(request: NextRequest) {
  try {
    const { event, data, gameTime } = await request.json();

    if (onLambda()) {
      writeStdout({
        event,
        gameTime: typeof gameTime === 'number' ? gameTime : null,
        data,
      });
      return NextResponse.json({ success: true });
    }

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
    if (onLambda()) {
      writeStdout({ event: 'LOG_RESET' });
      return NextResponse.json({ success: true });
    }

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
