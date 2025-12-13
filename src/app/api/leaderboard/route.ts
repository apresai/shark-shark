import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fetchLeaderboard, saveScore } from '@/lib/leaderboard';
import type { LeaderboardResponse, SaveScoreResponse, SaveScoreRequest } from '@/game/types';

/**
 * GET /api/leaderboard
 * Fetch the global top 10 leaderboard (no auth required)
 */
export async function GET() {
  console.log('[Leaderboard] GET request received');
  try {
    const entries = await fetchLeaderboard();
    console.log('[Leaderboard] Fetched entries:', { count: entries.length });

    const response: LeaderboardResponse = {
      entries,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Leaderboard] Failed to fetch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leaderboard
 * Save a score to the global leaderboard (auth required)
 */
export async function POST(request: Request) {
  console.log('[Leaderboard] POST request received');
  try {
    // Require authentication
    const session = await auth();
    console.log('[Leaderboard] Auth check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      email: session?.user?.email,
    });

    if (!session?.user?.id) {
      console.log('[Leaderboard] Auth rejected - no user ID');
      const response: SaveScoreResponse = {
        success: false,
        qualified: false,
        error: 'Authentication required',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const body: SaveScoreRequest = await request.json();
    const { score, tier, fishEaten } = body;
    console.log('[Leaderboard] Score submission:', { score, tier, fishEaten, userId: session.user.id });

    // Validate input
    if (typeof score !== 'number' || score < 0 || score > 99999999) {
      const response: SaveScoreResponse = {
        success: false,
        qualified: false,
        error: 'Invalid score',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (typeof tier !== 'number' || tier < 1 || tier > 5) {
      const response: SaveScoreResponse = {
        success: false,
        qualified: false,
        error: 'Invalid tier',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Save score
    const result = await saveScore({
      userId: session.user.id,
      displayName: session.user.name || 'Anonymous',
      photoUrl: session.user.image || '',
      score,
      tier,
      fishEaten: fishEaten || 0,
    });

    console.log('[Leaderboard] Save result:', result);
    const response: SaveScoreResponse = {
      success: true,
      qualified: result.qualified,
      rank: result.rank,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Leaderboard] Failed to save score:', error);
    const response: SaveScoreResponse = {
      success: false,
      qualified: false,
      error: 'Failed to save score',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
