import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WORKSPACE_RAIL_HINT_KEY, writeWorkspaceRailHint } from './railHint';
import { useRailColumnShown } from './useRailColumnShown';

const store = vi.hoisted(() => ({ available: false, loading: true }));

vi.mock('@/business/client/workspace/store', () => ({
  useWorkspaceStore: (
    selector: (s: { isWorkspaceAvailable: boolean; isWorkspaceLoading: boolean }) => unknown,
  ) => selector({ isWorkspaceAvailable: store.available, isWorkspaceLoading: store.loading }),
}));

beforeEach(() => {
  store.available = false;
  store.loading = true;
});

afterEach(() => localStorage.removeItem(WORKSPACE_RAIL_HINT_KEY));

describe('useRailColumnShown', () => {
  it('takes the column once workspaces are available', () => {
    store.available = true;
    store.loading = false;
    expect(renderHook(() => useRailColumnShown()).result.current).toBe(true);
  });

  it('holds the column while loading only if the rail showed last time', () => {
    expect(renderHook(() => useRailColumnShown()).result.current).toBe(false);

    writeWorkspaceRailHint(true);
    expect(renderHook(() => useRailColumnShown()).result.current).toBe(true);
  });

  it('gives the column up where the server has no workspaces', () => {
    writeWorkspaceRailHint(true);
    store.loading = false;
    expect(renderHook(() => useRailColumnShown()).result.current).toBe(false);
  });
});
