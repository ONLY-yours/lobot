import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUnreadBadge } from './useUnreadBadge';

const { broadcastHandlers, syncChannelBadge } = vi.hoisted(() => ({
  broadcastHandlers: new Map<string, () => void>(),
  syncChannelBadge: vi.fn(async (_count: number) => undefined),
}));

vi.mock('@lobechat/electron-client-ipc', () => ({
  useWatchBroadcast: (event: string, handler: () => void) => {
    broadcastHandlers.set(event, handler);
  },
}));

vi.mock('./notify', () => ({ syncChannelBadge }));

describe('useUnreadBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    broadcastHandlers.clear();
  });

  it('writes the unread count when it changes', () => {
    const { rerender } = renderHook(({ unread }) => useUnreadBadge(unread), {
      initialProps: { unread: 2 },
    });
    rerender({ unread: 6 });

    expect(syncChannelBadge.mock.calls).toEqual([[2], [6]]);
  });

  it('writes the count again after focus clears the badge', () => {
    renderHook(() => useUnreadBadge(6));
    syncChannelBadge.mockClear();

    act(() => broadcastHandlers.get('windowFocused')?.());

    expect(syncChannelBadge).toHaveBeenCalledWith(6);
  });
});
