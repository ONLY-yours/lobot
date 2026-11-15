import type { ChannelListItem, ChannelPublicMessage } from '@lobechat/types';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string, options?: Record<string, string>) =>
    options
      ? `${key}(${Object.entries(options)
          .filter(([name]) => name !== 'ns')
          .map(([name, value]) => `${name}=${value}`)
          .join(',')})`
      : key,
}));
vi.mock('@/services/channel', () => ({ channelService: {} }));
vi.mock('@/services/electron/completionSound', () => ({ completionSoundService: {} }));
vi.mock('@/services/electron/desktopNotification', () => ({ desktopNotificationService: {} }));
vi.mock('@/store/user', () => ({ getUserStoreState: () => ({}) }));
vi.mock('@/store/chat/utils/desktopNotification', () => ({
  buildNotificationBody: (content: string | undefined, fallback: string) => content || fallback,
  buildNotificationSender: vi.fn(),
}));

const { buildChannelBanner } = await import('./notify');

const channel = (extra: Partial<ChannelListItem> = {}) =>
  ({
    agentId: null,
    id: 'chn_1',
    lastMessage: { content: 'preview', createdAt: new Date() },
    projectId: null,
    title: 'Marketing',
    ...extra,
  }) as ChannelListItem;

const message = (name: string | null, content = 'ship it') =>
  ({ author: { avatar: null, id: 'u2', name, type: 'user' }, content }) as Pick<
    ChannelPublicMessage,
    'author' | 'content'
  >;

describe('buildChannelBanner', () => {
  it('shows "sender: message" under a group Channel title', () => {
    expect(buildChannelBanner({ channel: channel(), kind: 'message' }, message('Ann'))).toEqual({
      body: 'Ann: ship it',
      title: 'Marketing',
    });
  });

  it('titles a direct conversation by its Agent and shows only the message', () => {
    expect(
      buildChannelBanner(
        { channel: channel({ agentId: 'agt_1', title: 'Sanjo' }), kind: 'message' },
        message('Sanjo', 'done'),
      ),
    ).toEqual({ body: 'done', title: 'Sanjo' });
  });

  it('says who mentioned the user, and where', () => {
    expect(buildChannelBanner({ channel: channel(), kind: 'mention' }, message('Ann'))).toEqual({
      body: 'ship it',
      title: 'notification.mentionedBy(channel=Marketing,name=Ann)',
    });
  });

  it('falls back to the list preview when the message page could not load', () => {
    expect(buildChannelBanner({ channel: channel(), kind: 'mention' }, undefined)).toEqual({
      body: 'preview',
      title: 'notification.mentioned(channel=Marketing)',
    });
  });
});
