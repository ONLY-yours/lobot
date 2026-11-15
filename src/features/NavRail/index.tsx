'use client';

import { Flexbox } from '@lobehub/ui';
import * as stylex from '@stylexjs/stylex';
import { MessageCircleIcon, UsersIcon } from 'lucide-react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveWorkspaceSlug } from '@/business/client/hooks/useActiveWorkspaceSlug';
import { useChannelsEnabled } from '@/features/Channels/useChannelsEnabled';
import User from '@/features/HomeSidebar/Header/components/User';
import { messagesUnreadCount } from '@/features/MessageList/conversations';
import { useActiveLocation } from '@/hooks/useActiveLocation';
import { channelSelectors, useChannelStore } from '@/store/channel';
import { useHomeStore } from '@/store/home';
import { homeAgentListSelectors } from '@/store/home/selectors';

import { ActiveChannelSync, useMessagesUrl } from './messagesTarget';
import { resolveRailTab } from './railTab';
import { styles } from './style';
import TabItem from './TabItem';

/** The badge sums the Messages list rows, so it always matches what the list shows. */
const useMessagesUnread = (channelsEnabled: boolean) => {
  const channels = useChannelStore(channelSelectors.list);
  return useHomeStore((s) =>
    messagesUnreadCount(
      homeAgentListSelectors.allAgents(s),
      channelsEnabled ? channels : undefined,
    ),
  );
};

/**
 * Telegram-style tab bar at the foot of the list column. It replaces the old
 * left icon rail, so the window is just the list column and the content.
 */
const NavTabBar = memo(() => {
  const { t } = useTranslation('common');
  const { pathname } = useActiveLocation();
  const activeWorkspaceSlug = useActiveWorkspaceSlug();
  const channelsEnabled = useChannelsEnabled();
  const unread = useMessagesUnread(channelsEnabled);

  const activeTab = resolveRailTab(pathname, activeWorkspaceSlug);

  // Messages returns to the active Channel, or home where the conversation list lives.
  const { activeChannelId, url: messagesUrl } = useMessagesUrl(pathname, activeWorkspaceSlug);

  // Lobot's IA is two tabs: Contacts and Messages (Channels), in Telegram's order.
  const tabs = useMemo(
    () => [
      { icon: UsersIcon, key: 'contacts' as const, title: t('tab.contacts'), url: '/agents' },
      {
        icon: MessageCircleIcon,
        key: 'messages' as const,
        title: t('tab.messages'),
        url: messagesUrl,
      },
    ],
    [messagesUrl, t],
  );

  return (
    <Flexbox horizontal {...stylex.props(styles.bar)}>
      {/* The badge counts Channel rows, so the list stays fresh whenever Channels are on. */}
      {(activeChannelId || channelsEnabled) && <ActiveChannelSync />}
      {tabs.map((tab) => (
        <TabItem
          active={activeTab === tab.key}
          badge={tab.key === 'messages' ? unread : undefined}
          icon={tab.icon}
          key={tab.key}
          title={tab.title}
          url={tab.url}
        />
      ))}
      {/* The avatar opens the user panel, which owns settings, like Telegram's last tab. */}
      <User lite />
    </Flexbox>
  );
});

NavTabBar.displayName = 'NavTabBar';

export default NavTabBar;
