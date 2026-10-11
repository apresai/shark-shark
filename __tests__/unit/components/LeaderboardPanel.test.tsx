import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { LeaderboardPanel } from '../../../src/components/LeaderboardPanel';

type Resolve = (res: Response) => void;

function deferredFetch() {
  let resolve: Resolve = () => {};
  const fetchMock = jest.fn(
    () => new Promise<Response>((r) => {
      resolve = r;
    }),
  );
  global.fetch = fetchMock as unknown as typeof fetch;
  return { fetchMock, respond: (res: Response) => resolve(res) };
}

function json(body: unknown, status = 200): Response {
  return { ok: status < 400, status, json: async () => body } as unknown as Response;
}

const entry = {
  rank: 1,
  userId: 'u1',
  displayName: 'Ann',
  photoUrl: '',
  score: 4200,
  tier: 3,
  fishEaten: 12,
  timestamp: '2026-10-11T00:00:00Z',
};

describe('LeaderboardPanel', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows loading, then the fetched entries', async () => {
    const { fetchMock, respond } = deferredFetch();
    render(<LeaderboardPanel />);
    expect(screen.getByText('Loading...')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/leaderboard');

    await act(async () => {
      respond(json({ entries: [entry], lastUpdated: '' }));
    });
    expect(screen.getByText('Ann')).toBeTruthy();
    expect(screen.queryByText('Loading...')).toBeNull();
  });

  it('shows the error message when the request fails', async () => {
    const { respond } = deferredFetch();
    render(<LeaderboardPanel />);
    await act(async () => {
      respond(json({}, 500));
    });
    expect(screen.getByText('Failed to load leaderboard')).toBeTruthy();
  });

  it('ignores a response that arrives after unmount', async () => {
    const { respond } = deferredFetch();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<LeaderboardPanel />);
    unmount();
    await act(async () => {
      respond(json({ entries: [entry], lastUpdated: '' }));
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
