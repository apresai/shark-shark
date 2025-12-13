import { DynamoDBClient, QueryCommand, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall, marshall } from '@aws-sdk/util-dynamodb';
import type { GlobalHighScoreEntry } from '@/game/types';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const client = new DynamoDBClient({ region: AWS_REGION });
const TABLE_NAME = process.env.HIGH_SCORES_TABLE_NAME || 'SharkShark-HighScores-prod';
const LEADERBOARD_PK = 'LEADERBOARD#GLOBAL';
const MAX_ENTRIES = 10;
const MAX_SCORE = 9999999999;

// Log DynamoDB configuration on first import
console.log('[DynamoDB] Configured:', { region: AWS_REGION, tableName: TABLE_NAME });

/**
 * Create an inverted score string for DynamoDB sort key.
 * DynamoDB sorts ascending, so we invert to get descending order by score.
 */
function invertScore(score: number): string {
  return (MAX_SCORE - score).toString().padStart(10, '0');
}

/**
 * Fetch the current global leaderboard (top 10)
 */
export async function fetchLeaderboard(): Promise<GlobalHighScoreEntry[]> {
  console.log('[DynamoDB] Fetching leaderboard...');
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': { S: LEADERBOARD_PK },
    },
    ScanIndexForward: true, // Ascending (inverted = descending by actual score)
    Limit: MAX_ENTRIES,
  });

  try {
    const result = await client.send(command);
    console.log('[DynamoDB] Query result:', {
      itemCount: result.Items?.length ?? 0,
      scannedCount: result.ScannedCount,
    });

    return (result.Items || []).map((item, index) => {
      const data = unmarshall(item);
      return {
        rank: index + 1,
        score: data.score,
        tier: data.tier,
        fishEaten: data.fishEaten,
        displayName: data.displayName,
        photoUrl: data.photoUrl,
        userId: data.userId,
        timestamp: data.timestamp,
      };
    });
  } catch (error) {
    console.error('[DynamoDB] Query failed:', error);
    throw error;
  }
}

/**
 * Check if a score qualifies for the leaderboard
 */
export async function qualifiesForLeaderboard(score: number): Promise<boolean> {
  const current = await fetchLeaderboard();
  if (current.length < MAX_ENTRIES) return true;
  const lowestScore = current[current.length - 1].score;
  return score > lowestScore;
}

interface SaveScoreParams {
  userId: string;
  displayName: string;
  photoUrl: string;
  score: number;
  tier: number;
  fishEaten: number;
}

/**
 * Save a score to the global leaderboard
 */
export async function saveScore(params: SaveScoreParams): Promise<{ qualified: boolean; rank?: number }> {
  const { userId, displayName, photoUrl, score, tier, fishEaten } = params;
  console.log('[DynamoDB] Saving score:', { userId, score, tier, fishEaten });

  // Check if score qualifies
  const qualifies = await qualifiesForLeaderboard(score);
  console.log('[DynamoDB] Score qualifies:', qualifies);
  if (!qualifies) {
    return { qualified: false };
  }

  const timestamp = new Date().toISOString();
  const invertedScore = invertScore(score);
  const sk = `SCORE#${invertedScore}#USER#${userId}#${timestamp}`;

  const item = {
    PK: LEADERBOARD_PK,
    SK: sk,
    userId,
    displayName,
    photoUrl,
    score,
    tier,
    fishEaten,
    timestamp,
  };

  try {
    console.log('[DynamoDB] Putting item with SK:', sk);
    await client.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall(item),
    }));
    console.log('[DynamoDB] Item saved successfully');
  } catch (error) {
    console.error('[DynamoDB] Put failed:', error);
    throw error;
  }

  // Prune to keep only top 10 (async, don't wait)
  pruneLeaderboard().catch(err => console.error('[DynamoDB] Prune failed:', err));

  // Calculate new rank
  const leaderboard = await fetchLeaderboard();
  const rank = leaderboard.findIndex(e =>
    e.userId === userId && e.timestamp === timestamp
  ) + 1;
  console.log('[DynamoDB] New rank:', rank);

  return { qualified: true, rank: rank || undefined };
}

/**
 * Remove entries beyond the top 10
 */
async function pruneLeaderboard(): Promise<void> {
  // Query all entries (not just top 10)
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': { S: LEADERBOARD_PK },
    },
    ScanIndexForward: true,
  });

  const result = await client.send(command);
  const items = result.Items || [];

  // Delete any items beyond the top 10
  if (items.length > MAX_ENTRIES) {
    const toDelete = items.slice(MAX_ENTRIES);
    await Promise.all(
      toDelete.map(item =>
        client.send(new DeleteItemCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: item.PK,
            SK: item.SK,
          },
        }))
      )
    );
  }
}
