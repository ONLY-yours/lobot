import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import NavTabBar from './index';

const mocks = vi.hoisted(() => ({
  inbox: { enabled: true, unreadCount: 0 },
  pathname: '/',
  unread: 0,
}));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/hooks/useActiveLocation', () => ({
  useActiveLocation: () => ({ pathname: mocks.pathname }),
}));
vi.mock('@/business/client/hooks/useActiveWorkspaceSlug', () => ({
  useActiveWorkspaceSlug: () => null,
}));
vi.mock('@/features/Channels/useChannelsEnabled', () => ({ useChannelsEnabled: () => false }));
vi.mock('@/features/MessageList/conversations', () => ({
  messagesUnreadCount: () => mocks.unread,
}));
vi.mock('@/store/channel', () => ({
  channelActions: { useFetchList: () => {} },
  channelSelectors: { list: () => undefined },
  useChannelStore: (selector: (s: object) => unknown) => selector({}),
}));
vi.mock('@/store/home', () => ({
  useHomeStore: (selector: (s: object) => unknown) => selector({}),
}));
vi.mock('@/store/home/selectors', () => ({ homeAgentListSelectors: { allAgents: () => [] } }));
vi.mock('@/features/HomeSidebar/Header/components/useInboxUnreadCount', () => ({
  useInboxUnreadCount: () => mocks.inbox,
}));
vi.mock('@/features/HomeSidebar/Header/components/InboxModal', () => ({ openInboxModal: vi.fn() }));
vi.mock('@/features/User/UserAvatar', () => ({
  default: () => <div data-testid="user-avatar" />,
}));
vi.mock('@/features/Workspace/useWorkspaceAwareNavigate', () => ({
  useWorkspaceAwareNavigate: () => vi.fn(),
}));
vi.mock('@/features/Workspace/WorkspaceLink', () => ({
  default: ({ to, ...props }: { to: string }) => <a href={to} {...props} />,
}));

describe('NavTabBar', () => {
  beforeEach(() => {
    mocks.pathname = '/';
    mocks.unread = 0;
    mocks.inbox = { enabled: true, unreadCount: 0 };
  });

  // The notification bell is not shown in the tab bar, even with unread notifications.
  it('lays out Contacts, Messages and the user avatar in one bar, without the inbox', () => {
    mocks.inbox = { enabled: true, unreadCount: 5 };
    render(<NavTabBar />);

    const labels = screen.getAllByRole('link').map((el) => el.getAttribute('aria-label'));
    expect(labels).toEqual(['tab.contacts', 'tab.messages', 'tab.setting']);
    expect(screen.queryByRole('button', { name: 'inbox.title' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'tab.more' })).not.toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('marks the tab of the current route and badges unread Messages', () => {
    mocks.pathname = '/agents';
    mocks.unread = 120;
    render(<NavTabBar />);

    expect(screen.getByRole('link', { name: 'tab.contacts' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'tab.messages' })).not.toHaveAttribute('aria-current');
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('opens Settings from the avatar tab and marks it on settings routes', () => {
    mocks.pathname = '/settings/appearance';
    render(<NavTabBar />);

    const settings = screen.getByRole('link', { name: 'tab.setting' });
    expect(settings).toHaveAttribute('href', '/settings');
    expect(settings).toHaveAttribute('aria-current', 'page');
    expect(settings).toContainElement(screen.getByTestId('user-avatar'));
    expect(screen.getByRole('link', { name: 'tab.contacts' })).not.toHaveAttribute('aria-current');
  });

});
