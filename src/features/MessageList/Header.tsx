'use client';

import { CHANNEL_URL } from '@lobechat/const';
import { ActionIcon, DropdownMenu, Flexbox, Icon, SearchBar, Text } from '@lobehub/ui';
import { GroupBotSquareIcon } from '@lobehub/ui/icons';
import { PlusIcon } from 'lucide-react';
import { memo, type ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DESKTOP_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import { openCreateGroupChannel } from '@/features/Channels/CreateChannel';
import { useChannelsEnabled } from '@/features/Channels/useChannelsEnabled';
import { useCreateMenuItems } from '@/features/HomeSidebar/hooks';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';

import { useMessageSearch } from './SearchContext';

interface ListHeaderProps {
  actions?: ReactNode;
  title: string;
}

/** List column header: tab title on the left, column actions on the right. */
export const ListHeader = memo<ListHeaderProps>(({ title, actions }) => (
  <Flexbox
    horizontal
    align={'center'}
    gap={4}
    justify={'space-between'}
    paddingBlock={12}
    paddingInline={'14px 10px'}
  >
    <Text ellipsis fontSize={15} weight={600}>
      {title}
    </Text>
    <Flexbox horizontal align={'center'} gap={2}>
      {actions}
    </Flexbox>
  </Flexbox>
));

ListHeader.displayName = 'ListHeader';

const Header = memo(() => {
  const { t } = useTranslation(['common', 'chat']);
  const { query, setQuery } = useMessageSearch();
  const { createAgentMenuItem, createGroupChatMenuItem, isLoading } = useCreateMenuItems();
  const channelsEnabled = useChannelsEnabled();
  const navigate = useWorkspaceAwareNavigate();
  // Only the two things a conversation is started with: an Agent (whose modal also connects
  // external ones) and a group. With Channels on, a group is a multi-Agent Channel.
  const createItems = useMemo(
    () => [
      createAgentMenuItem(),
      channelsEnabled
        ? {
            icon: <Icon icon={GroupBotSquareIcon} />,
            key: 'newGroupChat',
            label: t('newGroupChat', { ns: 'chat' }),
            onClick: () => openCreateGroupChannel((id) => navigate(CHANNEL_URL(id))),
          }
        : createGroupChatMenuItem(),
    ],
    [channelsEnabled, createAgentMenuItem, createGroupChatMenuItem, navigate, t],
  );

  // WeChat-style header: a search box that filters the list, and one "+" entry.
  return (
    <Flexbox
      horizontal
      align={'center'}
      gap={6}
      paddingBlock={'12px 8px'}
      paddingInline={'10px 8px'}
    >
      <SearchBar
        allowClear
        placeholder={t('messageList.search')}
        style={{ flex: 1 }}
        value={query}
        variant={'filled'}
        onChange={(e) => setQuery(e.target.value)}
      />
      <DropdownMenu items={createItems}>
        <ActionIcon
          icon={PlusIcon}
          loading={isLoading}
          size={DESKTOP_HEADER_ICON_SIZE}
          title={t('messageList.newChat')}
        />
      </DropdownMenu>
    </Flexbox>
  );
});

Header.displayName = 'MessageListHeader';

export default Header;
