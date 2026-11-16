/**
 * @vitest-environment happy-dom
 */
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createReplicaState } from '@/libs/replica';
import { useChannelStore } from '@/store/channel';
import { channelViewKey } from '@/store/channel/projection';

import { ChannelSyncing } from './ChannelSyncing';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const params = { channelId: 'channel', threadId: null };
const showing = (source: 'server' | 'storage') =>
  act(() => {
    useChannelStore.setState({
      detailReplica: {
        ...createReplicaState(),
        entries: { [channelViewKey(params)]: { pending: [], source, updatedAt: 0 } },
      },
    });
  });

// Opening a conversation painted its stored messages as if they were the latest, with no sign
// that newer ones were still on the way.
describe('ChannelSyncing', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    useChannelStore.setState({ detailReplica: createReplicaState() });
  });

  it('shows while a stored copy waits for the server, then clears once it answers', () => {
    showing('storage');
    render(<ChannelSyncing failed={false} params={params} />);
    expect(screen.queryByText('syncing')).toBeNull();

    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText('syncing')).toBeTruthy();

    showing('server');
    expect(screen.queryByText('syncing')).toBeNull();
  });

  it('leaves a failed read to its own error', () => {
    showing('storage');
    render(<ChannelSyncing failed params={params} />);
    act(() => vi.advanceTimersByTime(200));

    expect(screen.queryByText('syncing')).toBeNull();
  });
});
