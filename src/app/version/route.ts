import { NextResponse } from 'next/server';

// GET /version: the build-stamped commit SHA and commit time, so "what is
// deployed" is one curl. next.config.ts injects both from git at build time
// (the commit's own time in UTC, deterministic per commit, never wall-clock).
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    {
      commit: process.env.BUILD_COMMIT_SHA ?? 'unknown',
      commitTime: process.env.BUILD_COMMIT_TIME ?? 'unknown',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
