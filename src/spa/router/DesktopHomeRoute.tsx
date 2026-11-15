'use client';

import { CHANNEL_URL } from '@lobechat/const';
import { Flexbox, Text } from '@lobehub/ui';
import { Navigate } from 'react-router';

import { channelActions, channelSelectors, useChannelStore } from '@/store/channel';

/**
 * Lobot has no dashboard: the Messages tab opens the first Channel, and the
 * Channel list stays beside it. Without any Channel it shows the empty state.
 */
const DesktopHomeRoute = () => {
  const sync = channelActions.useFetchList();
  const channels = useChannelStore(channelSelectors.list);

  if (channels && channels.length > 0) {
    return <Navigate replace to={CHANNEL_URL(channels[0].id)} />;
  }

  return (
    <Flexbox align={'center'} gap={8} height={'100%'} justify={'center'}>
      <Text type={'secondary'}>
        {sync.error ? 'Channel 列表加载失败' : '还没有 Channel'}
      </Text>
    </Flexbox>
  );
};

export default DesktopHomeRoute;
