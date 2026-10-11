/**
 * Unit tests for useWindowSize
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { renderHook, act } from '@testing-library/react';
import { useWindowSize } from '../../../src/hooks/useWindowSize';

function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height });
}

describe('useWindowSize', () => {
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;

  afterEach(() => {
    setWindowSize(originalWidth, originalHeight);
  });

  it('renders the default desktop size on the server', () => {
    setWindowSize(375, 667);
    function Probe() {
      const { width, height, isMobile } = useWindowSize();
      return <span>{`${width}x${height}:${isMobile}`}</span>;
    }
    expect(renderToString(<Probe />)).toContain('1024x768:false');
  });

  it('reads the real window size on the client', () => {
    setWindowSize(1280, 720);
    const { result } = renderHook(() => useWindowSize());
    expect(result.current).toEqual({ width: 1280, height: 720, isMobile: false });
  });

  it('flags widths at or below the 768px breakpoint as mobile', () => {
    setWindowSize(768, 1024);
    const { result } = renderHook(() => useWindowSize());
    expect(result.current.isMobile).toBe(true);
  });

  it('updates on resize and stops listening after unmount', () => {
    setWindowSize(1280, 720);
    const { result, unmount } = renderHook(() => useWindowSize());

    act(() => {
      setWindowSize(400, 800);
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toEqual({ width: 400, height: 800, isMobile: true });

    const removeSpy = jest.spyOn(window, 'removeEventListener');
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('does not re-render when the size is unchanged', () => {
    setWindowSize(1280, 720);
    let renders = 0;
    renderHook(() => {
      renders += 1;
      return useWindowSize();
    });
    const settled = renders;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(renders).toBe(settled);
  });
});
