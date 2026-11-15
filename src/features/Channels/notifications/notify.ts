import { CHANNEL_URL } from '@lobechat/const';
import type { ChannelPublicMessage } from '@lobechat/types';
import { t } from 'i18next';

import { channelService } from '@/services/channel';
import { completionSoundService } from '@/services/electron/completionSound';
import { desktopNotificationService } from '@/services/electron/desktopNotification';
import {
  buildNotificationBody,
  buildNotificationSender,
} from '@/store/chat/utils/desktopNotification';
import { getUserStoreState } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { isCurrentUserAuthor } from '../memberName';
import type { ChannelActivityEvent } from './activity';

/** The newest message someone else posted in the main conversation, if the latest page has one. */
const latestIncoming = async (channelId: string): Promise<ChannelPublicMessage | undefined> => {
  const detail = await channelService.detail({ channelId });
  const userId = userProfileSelectors.userId(getUserStoreState());
  return detail.messages.findLast((message) => !isCurrentUserAuthor(message.author, userId));
};

interface ChannelBanner {
  body: string;
  title: string;
}

/**
 * Banner wording, the way chat apps word it:
 * - a direct conversation is titled by its Agent and shows the message;
 * - a group shows "sender: message" under the Channel title;
 * - an @mention says who mentioned the user, and where.
 */
export const buildChannelBanner = (
  { channel, kind }: ChannelActivityEvent,
  message: Pick<ChannelPublicMessage, 'author' | 'content'> | undefined,
): ChannelBanner => {
  const sender = message?.author.name || '';
  const text = buildNotificationBody(
    message?.content ?? channel.lastMessage?.content,
    t('notification.newMessage', { ns: 'channel' }),
  );

  if (kind === 'mention')
    return {
      body: text,
      title: sender
        ? t('notification.mentionedBy', { channel: channel.title, name: sender, ns: 'channel' })
        : t('notification.mentioned', { channel: channel.title, ns: 'channel' }),
    };

  const direct = !!channel.agentId && !channel.projectId;
  return {
    body: direct || !sender ? text : `${sender}: ${text}`,
    title: channel.title,
  };
};

/**
 * Announce one Channel's new activity: an OS banner that opens the Channel, carrying the user's
 * notification sound. The main process shows banners only while the window is hidden or
 * unfocused; when it skips one, the in-app chime plays instead so a message in another Channel
 * is still heard.
 */
export const notifyChannelActivity = async (event: ChannelActivityEvent): Promise<void> => {
  const { channel } = event;
  try {
    const [message, soundName, sender] = await Promise.all([
      // The list preview is enough to fall back on when the page cannot load.
      latestIncoming(channel.id).catch(() => undefined),
      completionSoundService.getNotificationSoundFile(),
      // A direct conversation reads as a message from its Agent, with the Agent's avatar.
      channel.agentId ? buildNotificationSender({ agentId: channel.agentId }) : undefined,
    ]);

    const result = await desktopNotificationService.showNotification({
      ...buildChannelBanner(event, message),
      navigate: { path: CHANNEL_URL(channel.id) },
      sender: sender && { ...sender, conversationId: channel.id },
      soundName,
    });
    if (result?.success && !result.skipped) return;

    await completionSoundService.play();
  } catch (error) {
    console.error('Channel desktop notification failed:', error);
  }
};

/** Mirrors the Messages tab's unread count on the dock / taskbar badge; 0 clears it. */
export const syncChannelBadge = (count: number) =>
  desktopNotificationService
    .setBadgeCount(count)
    .catch((error) => console.error('Badge count update failed:', error));
