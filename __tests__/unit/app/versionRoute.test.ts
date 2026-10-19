/**
 * @jest-environment node
 */
import { GET, dynamic } from '@/app/version/route';

describe('GET /version', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('returns the build-stamped commit and time, uncached', async () => {
    process.env.BUILD_COMMIT_SHA = '0123456789abcdef0123456789abcdef01234567';
    process.env.BUILD_COMMIT_TIME = '2026-10-11T00:00:00Z';

    const res = GET();

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({
      commit: '0123456789abcdef0123456789abcdef01234567',
      commitTime: '2026-10-11T00:00:00Z',
    });
  });

  it('reports unknown when the build stamp is missing', async () => {
    delete process.env.BUILD_COMMIT_SHA;
    delete process.env.BUILD_COMMIT_TIME;

    expect(await GET().json()).toEqual({ commit: 'unknown', commitTime: 'unknown' });
  });

  it('is rendered per request, never prerendered at build time', () => {
    expect(dynamic).toBe('force-dynamic');
  });
});
