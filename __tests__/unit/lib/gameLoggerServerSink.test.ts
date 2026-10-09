/**
 * The /api/log sink is a local-development aid: production must never send.
 */

describe('gameLogger server sink', () => {
  const originalEnv = process.env.NODE_ENV;
  const env = process.env as Record<string, string | undefined>;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    fetchMock = jest.fn(() => Promise.resolve({ ok: true, status: 204 }));
    (globalThis as { fetch?: unknown }).fetch = fetchMock;
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it.each([
    ['production', 0],
    ['test', 0],
    ['development', 2],
  ])('NODE_ENV=%s sends %i requests for start() plus one log()', async (nodeEnv, expected) => {
    env.NODE_ENV = nodeEnv;
    const { gameLogger } = await import('../../../src/lib/gameLogger');

    gameLogger.start();

    // start() sends DELETE, then logs SESSION_START (one POST).
    expect(fetchMock).toHaveBeenCalledTimes(expected);
  });
});
