/**
 * Unit tests for useActiveTheme
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { renderHook, act } from '@testing-library/react';
import { useActiveTheme } from '../../../src/hooks/useActiveTheme';
import { themeManager } from '../../../src/game/ThemeManager';
import { THEME_REGISTRY } from '../../../src/game/themes/themeRegistry';
import type { ThemeId } from '../../../src/game/types';

const themeIds = Object.keys(THEME_REGISTRY) as ThemeId[];
const otherTheme = themeIds.find((id) => id !== 'classic') as ThemeId;

describe('useActiveTheme', () => {
  afterEach(async () => {
    await themeManager.setActiveTheme('classic');
  });

  it('has a non-classic theme to switch to', () => {
    expect(otherTheme).toBeDefined();
  });

  it('renders the default theme on the server', async () => {
    await themeManager.setActiveTheme(otherTheme);
    function Probe() {
      return <span>{useActiveTheme()}</span>;
    }
    expect(renderToString(<Probe />)).toContain('classic');
  });

  it('returns the manager theme on the client', async () => {
    await themeManager.setActiveTheme(otherTheme);
    const { result } = renderHook(() => useActiveTheme());
    expect(result.current).toBe(otherTheme);
  });

  it('follows theme changes and unsubscribes on unmount', async () => {
    const unsubscribes: jest.Mock[] = [];
    const realOnThemeChange = themeManager.onThemeChange.bind(themeManager);
    const subscribeSpy = jest
      .spyOn(themeManager, 'onThemeChange')
      .mockImplementation((callback) => {
        const unsubscribe = jest.fn(realOnThemeChange(callback));
        unsubscribes.push(unsubscribe);
        return unsubscribe;
      });

    const { result, unmount } = renderHook(() => useActiveTheme());
    expect(result.current).toBe('classic');
    expect(unsubscribes.length).toBeGreaterThan(0);

    await act(async () => {
      await themeManager.setActiveTheme(otherTheme);
    });
    expect(result.current).toBe(otherTheme);

    unmount();
    expect(unsubscribes.every((u) => u.mock.calls.length === 1)).toBe(true);
    subscribeSpy.mockRestore();
  });
});
