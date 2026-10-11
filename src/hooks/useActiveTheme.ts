/**
 * useActiveTheme - React hook for the active game theme
 *
 * Subscribes to the ThemeManager singleton through useSyncExternalStore so
 * components read the current theme during render instead of copying it
 * into state from an effect.
 */

import { useSyncExternalStore } from 'react';
import type { ThemeId } from '../game/types';
import { themeManager, DEFAULT_THEME } from '../game/ThemeManager';

function subscribe(onChange: () => void): () => void {
  return themeManager.onThemeChange(onChange);
}

function getSnapshot(): ThemeId {
  return themeManager.getActiveTheme();
}

// The server has no localStorage, so it always renders the default theme; the
// client switches to the stored theme right after hydration.
function getServerSnapshot(): ThemeId {
  return DEFAULT_THEME;
}

/** The active game theme, kept in sync with ThemeManager. */
export function useActiveTheme(): ThemeId {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
