import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import DesktopHomeRoute from './DesktopHomeRoute';

const mocks = vi.hoisted(() => ({ channels: undefined as unknown[] | undefined }));

vi.mock('react-router', () => ({
  Navigate: ({ to }: { to: string }) => createElement('div', { 'data-testid': 'redirect' }, to),
}));
vi.mock('@/store/channel', () => ({
  channelActions: { useFetchList: () => ({}) },
  channelSelectors: { list: () => mocks.channels },
  useChannelStore: (selector: (s: object) => unknown) => selector({}),
}));

const channel = (id: string, updatedAt: string, lastMessageAt?: string, status = 'active') => ({
  createdAt: '2026-11-01T00:00:00Z',
  id,
  lastMessage: lastMessageAt ? { content: 'hi', createdAt: lastMessageAt } : null,
  status,
  updatedAt,
});

describe('DesktopHomeRoute', () => {
  // The server's first row was an untouched direct chat, so the Messages tab opened an empty page.
  it('opens the Channel with the latest message, not the first one the server lists', () => {
    mocks.channels = [
      channel('chn_untouched', '2026-11-12T17:04:00Z'),
      channel('chn_older', '2026-11-12T16:16:00Z', '2026-11-12T16:16:00Z'),
      channel('chn_latest', '2026-11-12T16:40:00Z', '2026-11-12T16:40:00Z'),
      channel('chn_archived', '2026-11-13T00:00:00Z', '2026-11-13T00:00:00Z', 'archived'),
    ];

    render(createElement(DesktopHomeRoute));

    expect(screen.getByTestId('redirect')).toHaveTextContent('chn_latest');
  });

  it('opens the most recently active Channel when none has a message yet', () => {
    mocks.channels = [
      channel('chn_a', '2026-11-10T00:00:00Z'),
      channel('chn_b', '2026-11-12T00:00:00Z'),
    ];

    render(createElement(DesktopHomeRoute));

    expect(screen.getByTestId('redirect')).toHaveTextContent('chn_b');
  });

  it('shows the empty state without any Channel', () => {
    mocks.channels = [];

    render(createElement(DesktopHomeRoute));

    expect(screen.queryByTestId('redirect')).not.toBeInTheDocument();
    expect(screen.getByText('还没有 Channel')).toBeInTheDocument();
  });
});
