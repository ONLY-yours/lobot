import urlJoin from 'url-join';

import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { useAppOrigin } from '@/hooks/useAppOrigin';
import { channelSelectors, useChannelStore } from '@/store/channel';

/**
 * Opens a direct conversation's Agent: one's own at its page here, at `path` under it. Another
 * person's Agent has no page here, only its share's visitor page on the web, which opens in the
 * browser; undefined when that share's handle is not known, so the action is hidden.
 */
export const useOpenDirectAgent = (
  channelId: string,
  agentId: string,
): ((path?: string) => void) | undefined => {
  const navigate = useWorkspaceAwareNavigate();
  const appOrigin = useAppOrigin();
  // undefined: one's own Agent; null: a shared Agent without a known handle.
  const shareHandle = useChannelStore((s) => {
    const item = channelSelectors.list(s)?.find((channel) => channel.id === channelId);
    return item?.sharedAgent ? (item.sharedAgentHandle ?? null) : undefined;
  });

  if (shareHandle === undefined) return (path = '') => navigate(`/agent/${agentId}${path}`);
  if (!shareHandle) return;
  const url = urlJoin(appOrigin, 'a', encodeURIComponent(shareHandle));
  return () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
};
