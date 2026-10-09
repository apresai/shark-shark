/**
 * @jest-environment node
 */

import { existsSync } from 'fs';
import { appendFile, mkdir, writeFile } from 'fs/promises';
import { NextRequest } from 'next/server';
import { DELETE, POST } from '../../../src/app/api/log/route';

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: jest.fn(() => false),
  };
});

jest.mock('fs/promises', () => {
  const actual = jest.requireActual<typeof import('fs/promises')>('fs/promises');
  return {
    ...actual,
    mkdir: jest.fn(async () => undefined),
    appendFile: jest.fn(async () => undefined),
    writeFile: jest.fn(async () => undefined),
  };
});

const existsSyncMock = existsSync as jest.MockedFunction<typeof existsSync>;
const mkdirMock = mkdir as jest.MockedFunction<typeof mkdir>;
const appendFileMock = appendFile as jest.MockedFunction<typeof appendFile>;
const writeFileMock = writeFile as jest.MockedFunction<typeof writeFile>;

function postRequest(body: string): NextRequest {
  return new NextRequest('http://localhost/api/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

describe('/api/log', () => {
  const originalFunctionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
  let consoleLog: jest.SpiedFunction<typeof console.log>;
  let consoleError: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    existsSyncMock.mockReset();
    existsSyncMock.mockReturnValue(false);
    mkdirMock.mockReset();
    mkdirMock.mockResolvedValue(undefined);
    appendFileMock.mockReset();
    appendFileMock.mockResolvedValue(undefined);
    writeFileMock.mockReset();
    writeFileMock.mockResolvedValue(undefined);
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalFunctionName === undefined) {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    } else {
      process.env.AWS_LAMBDA_FUNCTION_NAME = originalFunctionName;
    }
    consoleLog.mockRestore();
    consoleError.mockRestore();
  });

  it.each([
    ['a valid event', JSON.stringify({ event: 'PLAYER_DEATH', data: { lives: 2 }, gameTime: 12.5 })],
    ['an unreadable body', 'not-json'],
    ['an oversized payload', JSON.stringify({ event: 'X', data: { blob: 'a'.repeat(100_000) } })],
  ])('drops POST with %s on Lambda: 204, no filesystem, no log line', async (_label, body) => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'shark-shark';

    const response = await POST(postRequest(body));

    expect(response.status).toBe(204);
    expect(existsSyncMock).not.toHaveBeenCalled();
    expect(mkdirMock).not.toHaveBeenCalled();
    expect(appendFileMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('drops DELETE on Lambda: 204, no filesystem, no log line', async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'shark-shark';

    const response = await DELETE();

    expect(response.status).toBe(204);
    expect(mkdirMock).not.toHaveBeenCalled();
    expect(writeFileMock).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it('appends to game-logs/game.log when not on Lambda', async () => {
    existsSyncMock.mockReturnValue(true);

    const response = await POST(postRequest(JSON.stringify({
      event: 'GAME_START',
      data: { tier: 1 },
      gameTime: 1.2,
    })));

    expect(response.status).toBe(200);
    expect(mkdirMock).not.toHaveBeenCalled();
    expect(appendFileMock).toHaveBeenCalledTimes(1);
    const [file, line] = appendFileMock.mock.calls[0];
    expect(String(file)).toMatch(/game-logs\/game\.log$/);
    expect(String(line)).toContain('GAME_START');
    expect(String(line)).toContain('1.20');
    expect(String(line)).toContain('{"tier":1}');
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it('creates game-logs before the first local append', async () => {
    existsSyncMock.mockReturnValue(false);

    const response = await POST(postRequest(JSON.stringify({
      event: 'SESSION_START',
      gameTime: 0,
    })));

    expect(response.status).toBe(200);
    expect(mkdirMock).toHaveBeenCalledWith(
      expect.stringMatching(/game-logs$/),
      { recursive: true },
    );
    const [, line] = appendFileMock.mock.calls[0];
    expect(String(line)).toContain('SESSION_START');
    expect(String(line)).not.toContain('{');
  });

  it('rewrites the local log file on DELETE', async () => {
    existsSyncMock.mockReturnValue(false);

    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(mkdirMock).toHaveBeenCalled();
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    const [file, header] = writeFileMock.mock.calls[0];
    expect(String(file)).toMatch(/game-logs\/game\.log$/);
    expect(String(header)).toMatch(/^=== Game Log Started .+ ===\n$/);
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it('returns 500 for an unreadable body locally and does not create a directory', async () => {

    const response = await POST(postRequest('not-json'));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ success: false });
    expect(mkdirMock).not.toHaveBeenCalled();
    expect(appendFileMock).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });
});
