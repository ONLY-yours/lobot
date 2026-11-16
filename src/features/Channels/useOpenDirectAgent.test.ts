/**
 * @vitest-environment happy-dom
 */
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useOpenDirectAgent } from './useOpenDirectAgent';

const { channels, navigate } = vi.hoisted(() => ({
  channels: { list: [] as Array<Record<string, unknown>> },
  navigate: vi.fn(),
}));

vi.mock('@/features/Workspace/useWorkspaceAwareNavigate', () => ({
  useWorkspaceAwareNavigate: () => navigate,
}));
vi.mock('@/hooks/useAppOrigin', () => ({ useAppOrigin: () => 'https://app.lobehub.com' }));
vi.mock('@/store/channel', () => ({
  channelSelectors: { list: (s: typeof channels) => s.list },
  useChannelStore: (selector: (s: typeof channels) => unknown) => selector(channels),
}));

afterEach(() => {
  channels.list = [];
  navigate.mockClear();
  vi.restoreAllMocks();
});

describe('useOpenDirectAgent', () => {
  it('opens one’s own Agent at its page in the app', () => {
    channels.list = [{ agentId: 'agt_mine', id: 'chn_1', sharedAgent: false }];
    const { result } = renderHook(() => useOpenDirectAgent('chn_1', 'agt_mine'));

    result.current?.('/profile');

    expect(navigate).toHaveBeenCalledWith('/agent/agt_mine/profile');
  });

  // Another person's Agent has no in-app page: `/agent/<id>` is not the visitor's to open.
  it('opens another person’s Agent at its share page in the browser', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    channels.list = [
      { agentId: 'agt_theirs', id: 'chn_1', sharedAgent: true, sharedAgentHandle: 'wan-nuo' },
    ];
    const { result } = renderHook(() => useOpenDirectAgent('chn_1', 'agt_theirs'));

    result.current?.('/profile');

    expect(open).toHaveBeenCalledWith(
      'https://app.lobehub.com/a/wan-nuo',
      '_blank',
      'noopener,noreferrer',
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('offers nothing for a shared Agent whose share handle is unknown', () => {
    channels.list = [{ agentId: 'agt_theirs', id: 'chn_1', sharedAgent: true }];
    const { result } = renderHook(() => useOpenDirectAgent('chn_1', 'agt_theirs'));

    expect(result.current).toBeUndefined();
  });
});
