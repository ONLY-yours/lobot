import { CHANNEL_URL } from '@lobechat/const';
import { useCallback } from 'react';

import { useChannelsEnabled } from '@/features/Channels/useChannelsEnabled';
import { CONTACT_URL } from '@/features/ContactList/const';
import { stableWorkspaceAwareNavigate as navigate } from '@/features/Workspace/stableWorkspaceAwareNavigate';
import { channelActions } from '@/store/channel';

/**
 * Where a newly created Agent opens: its direct Channel, ready for the first message, as
 * "Message" on its contact card does. Without Channels, or when the Channel cannot open, it
 * opens the contact card instead — Lobot has no Agent page to fall back to.
 *
 * Navigates through the app-wide router: the modal that created the Agent, and the
 * component that opened it, are usually gone by the time the Channel opens.
 */
export const useLandOnCreatedAgent = () => {
  const channelsEnabled = useChannelsEnabled();

  return useCallback(
    async (agentId: string) => {
      if (channelsEnabled) {
        try {
          const channelId = await channelActions.openDirect(agentId);
          if (channelId) return navigate(CHANNEL_URL(channelId));
        } catch (error) {
          console.error('[agent] Failed to open the new Agent’s direct Channel', error);
        }
      }
      navigate(CONTACT_URL(agentId));
    },
    [channelsEnabled],
  );
};
