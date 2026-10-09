/**
 * API route for game event logs. A local-development debugging aid.
 *
 * Local dev appends to game-logs/game.log (gitignored). On Lambda this route
 * accepts and drops the request: /var/task is read-only, and forwarding every
 * game event from an unauthenticated endpoint to CloudWatch would let any
 * caller flood the log group. The client only sends in development anyway
 * (see gameLogger serverLogging).
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

function dropped(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  if (onLambda()) return dropped();
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
  if (onLambda()) return dropped();
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
