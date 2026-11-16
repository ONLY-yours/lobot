import type { ChannelDetail, ChannelPublicMember, ChannelPublicMessage } from '@lobechat/types';
import {
  ActionIcon,
  Button,
  copyToClipboard,
  Divider,
  DropdownMenu,
  Flexbox,
  Icon,
  Text,
  toast,
} from '@lobehub/ui';
import * as stylex from '@stylexjs/stylex';
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  GitBranch,
  MessagesSquare,
  MoreHorizontal,
  Reply,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AgentAvatar from '@/components/AgentAvatar';
import CollapsibleContent from '@/components/CollapsibleContent';
import AgentProfilePopup from '@/features/AgentProfileCard/AgentProfilePopup';
import { ChatItem } from '@/features/Conversation/ChatItem';
import Markdown from '@/features/Conversation/Markdown';
import EntityLinkElement from '@/features/EntityLink/element';
import UserAvatar from '@/features/User/UserAvatar';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { authorAvatar, isCurrentUserAuthor, memberName } from './memberName';
import { MemberProfilePopup } from './MemberProfilePopup';
import { CHANNEL_MENTION_TAG, remarkChannelMentions } from './mentionMarkdown';
import { MessageAttachments } from './MessageAttachments';
import { channelMessageTime, channelTimeFormatters, foldsByDefault } from './messagePresentation';
import { MessageFailureMark, MessageRoutingStatus } from './MessageReceipts';
import { RelayLabel } from './RelayLabel';
import { showsReplyQuote } from './replyQuote';
import type { ReplyTopic } from './ReplyTopicPanel';
import { ReplyWorks } from './ReplyWorks';
import { styles } from './styles';
import type { ChannelThreadDraft } from './threadDraft';
import { ThreadPreviewCard } from './ThreadPreviewCard';
import type { ChannelReplyTarget } from './useReplyTarget';

const rehypePlugins = [EntityLinkElement.rehypePlugin];
const HISTORIC_FOLD_OVERFLOW = 240;

/** Message text with the members it mentioned shown as chips that show who they are on hover. */
const MessageText = ({ content, members }: { content: string; members: ChannelPublicMember[] }) => {
  const names = members.map((member) => memberName(member, '')).filter(Boolean);
  const key = names.join('\n');
  // Polling re-renders every message while replies run; a new plugin array or component map
  // would make the memoized Markdown parse each message again on every refresh.
  const remarkPlugins = useMemo(() => [remarkChannelMentions(key ? key.split('\n') : [])], [key]);
  const memberKey = members.map((member) => member.id).join('\n');
  const components = useMemo(
    () => ({
      [CHANNEL_MENTION_TAG]: ({ children, name }: { children?: ReactNode; name?: string }) => {
        const member = members.find((entry) => memberName(entry, '') === name);
        return (
          <MemberProfilePopup member={member}>
            {/* A DOM element, so the popover can attach its hover handlers and anchor ref. */}
            <span {...stylex.props(styles.mention, !!member && styles.mentionHoverable)}>
              {children}
            </span>
          </MemberProfilePopup>
        );
      },
      // GitHub and LobeHub links render as the same chips the conversation shows.
      [EntityLinkElement.tag]: EntityLinkElement.Component,
    }),
    // Keyed by member ids and names: the members array is rebuilt on every poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memberKey, key],
  );
  return (
    <Markdown components={components} rehypePlugins={rehypePlugins} remarkPlugins={remarkPlugins}>
      {content}
    </Markdown>
  );
};

export const ChannelMessage = ({
  delivery,
  detail,
  continuation = false,
  message,
  isRoot,
  highlighted,
  threadId,
  onOpenThread,
  onStartThread,
  onReply,
  onJumpToMessage,
  onOpenTopic,
  pending = false,
}: {
  continuation?: boolean;
  /** For a message the server has not confirmed: its send status, in place of routing. */
  delivery?: ReactNode;
  detail: ChannelDetail;
  isRoot?: boolean;
  highlighted?: boolean;
  message: ChannelPublicMessage;
  onOpenThread?: (threadId: string) => void;
  onStartThread?: (draft: ChannelThreadDraft) => void;
  onReply?: (message: ChannelPublicMessage) => void;
  onJumpToMessage?: (message: ChannelReplyTarget) => void;
  /** Opens the Agent topic a reply came from; offered only when the server shares it. */
  onOpenTopic?: (topic: ReplyTopic) => void;
  /** Sent from this tab and not yet confirmed by the server. */
  pending?: boolean;
  threadId?: string | null;
}) => {
  const { t, i18n } = useTranslation('channel');
  const timeFormats = useMemo(() => channelTimeFormatters(i18n.language), [i18n.language]);
  const date = new Date(message.createdAt);
  // Failed/unassigned requests keep their identity row and recovery affordance.
  // A relayed message keeps its header, so the relay label beside the time stays visible.
  const compact =
    continuation &&
    !isRoot &&
    !message.via &&
    message.routingStatus !== 'unassigned' &&
    !detail.jobs.some((job) => job.messageId === message.id && job.status === 'failed');
  // A continuation sits under its header, so its hover stamp only needs the clock.
  const timestamp = (
    <time
      dateTime={date.toISOString()}
      title={timeFormats.full.format(date)}
      {...stylex.props(styles.messageTime)}
    >
      {compact
        ? timeFormats.time.format(date)
        : channelMessageTime(date, { locale: i18n.language, yesterday: t('date.yesterday') })}
    </time>
  );
  const isOwnMessage = useUserStore((s) =>
    isCurrentUserAuthor(message.author, userProfileSelectors.userId(s)),
  );
  // Inside a thread, its root and replies link nowhere else.
  const thread =
    !threadId && !isRoot && detail.threads.find((entry) => entry.rootMessageId === message.id);
  const canBranch = !threadId && !isRoot && !thread && !!onStartThread;
  const startThread = () =>
    onStartThread?.({
      root: message,
      attachments: detail.attachments.filter((file) => message.fileIds.includes(file.id)),
    });
  const isRequest = message.author.type === 'user' && !isRoot;
  const agentAuthorId = message.author.type === 'agent' ? message.author.id : null;
  const userMember =
    message.author.type === 'user' && message.author.id
      ? detail.members.find(
          (member) => member.actorType === 'user' && member.userId === message.author.id,
        )
      : undefined;
  const agentMember = agentAuthorId
    ? detail.members.find((member) => member.agentId === agentAuthorId)
    : undefined;
  const sourceTopicId = message.sourceTopicId;
  // A long message from before yesterday folds by default so scrolling back stays quick; a
  // recent one stays open and folding it is an explicit choice from "more".
  const [historic] = useState(() => foldsByDefault(date));
  // A direct conversation is a chat with one Agent; folding its recent answers only adds a click.
  const collapsible = historic || !detail.channel.agentId;
  const [collapsed, setCollapsed] = useState(historic);
  const [overflowing, setOverflowing] = useState(false);
  const moreItems = [
    ...(agentAuthorId && sourceTopicId && onOpenTopic
      ? [
          {
            icon: MessagesSquare,
            key: 'openTopic',
            label: t('topic.open'),
            onClick: () =>
              onOpenTopic({
                agentId: agentAuthorId,
                avatar: message.author.avatar,
                name: message.author.name || t('unnamedAgent'),
                title: message.sourceTopicTitle,
                topicId: sourceTopicId,
              }),
          },
        ]
      : []),
    ...(message.content
      ? [
          {
            icon: Copy,
            key: 'copy',
            label: t('message.copy'),
            onClick: async () => {
              await copyToClipboard(message.content);
              toast.success(t('message.copied'));
            },
          },
        ]
      : []),
    ...(collapsible && overflowing
      ? [
          {
            icon: collapsed ? ChevronsUpDown : ChevronsDownUp,
            key: 'toggleCollapse',
            label: t(collapsed ? 'message.expand' : 'message.collapse'),
            onClick: () => setCollapsed(!collapsed),
          },
        ]
      : []),
  ];
  const hasToolbar = !!onReply || canBranch || moreItems.length > 0;
  const mentionedMembers = detail.members.filter((member) => message.mentions.includes(member.id));
  return (
    <div
      aria-busy={pending || undefined}
      aria-label={message.author.name || t('deletedMember')}
      data-continuation={compact || undefined}
      data-message-id={message.id}
      role="article"
      {...stylex.props(
        styles.messageRow,
        compact && hasToolbar && styles.continuationWithAction,
        highlighted && styles.highlightedMessage,
        pending && styles.pendingMessage,
        stylex.defaultMarker(),
      )}
    >
      {compact && <span {...stylex.props(styles.continuationTime)}>{timestamp}</span>}
      <ChatItem
        quietHeader
        showAvatar
        showTitle
        agentId={message.author.type === 'agent' ? message.author.id : undefined}
        avatarProps={{ shape: 'circle', size: 36 }}
        gap={4}
        id={message.id}
        paddingBlock={compact ? 2 : 8}
        placement="left"
        showHeader={!compact}
        style={{ paddingInlineStart: 48 }}
        avatar={{
          avatar: authorAvatar(message.author),
          title: message.author.name || t('deletedMember'),
        }}
        belowMessage={
          delivery ?? (isRequest ? <MessageRoutingStatus message={message} /> : undefined)
        }
        customAvatarRender={(_, avatar) => (
          <Flexbox {...stylex.props(styles.messageAvatar)}>
            {!agentAuthorId ? (
              // A person shows who they are on hover, the way an Agent shows its profile.
              <MemberProfilePopup member={userMember}>
                <span
                  {...stylex.props(
                    styles.messageAvatarInline,
                    !!userMember && styles.messageAvatarHoverable,
                  )}
                >
                  {isOwnMessage ? <UserAvatar shape={'circle'} size={36} /> : avatar}
                </span>
              </MemberProfilePopup>
            ) : (
              // Same profile card an Agent shows on hover in goals and tasks.
              <AgentProfilePopup
                agentId={agentAuthorId}
                trigger={'hover'}
                agent={{
                  avatar: message.author.avatar,
                  description: agentMember?.description,
                  title: message.author.name,
                }}
              >
                <span {...stylex.props(styles.messageAvatarHoverable)}>
                  <AgentAvatar
                    agentId={agentAuthorId}
                    avatar={message.author.avatar}
                    name={message.author.name}
                    shape={'circle'}
                    size={36}
                  />
                </span>
              </AgentProfilePopup>
            )}
          </Flexbox>
        )}
        message={
          <Flexbox gap={8}>
            {!isRoot &&
              showsReplyQuote(message) &&
              (message.replyTo ? (
                <Button
                  aria-label={t('reply.viewOriginal')}
                  icon={Reply}
                  size="small"
                  style={{ alignSelf: 'flex-start', maxWidth: '100%', minWidth: 0 }}
                  type="text"
                  onClick={() => onJumpToMessage?.(message.replyTo!)}
                >
                  <Text ellipsis as="span" fontSize={12} type="secondary">
                    {message.replyTo.author.name || t('deletedMember')}
                    {': '}
                    {message.replyTo.content || t('reply.attachment')}
                  </Text>
                </Button>
              ) : (
                <Text fontSize={12} type="secondary">
                  {t('reply.unavailable')}
                </Text>
              ))}
            {message.fileIds.length > 0 && (
              <MessageAttachments attachments={detail.attachments} fileIds={message.fileIds} />
            )}
            {message.content &&
              (collapsible ? (
                <CollapsibleContent
                  hideCollapseToggle
                  collapsed={collapsed}
                  fade={false}
                  key={message.id}
                  maxHeight={160}
                  // Folding unasked is only worth it for a really long message.
                  overflowThreshold={historic ? HISTORIC_FOLD_OVERFLOW : undefined}
                  onCollapsedChange={setCollapsed}
                  onOverflowChange={setOverflowing}
                >
                  <MessageText content={message.content} members={mentionedMembers} />
                </CollapsibleContent>
              ) : (
                <MessageText content={message.content} members={mentionedMembers} />
              ))}
            {!!message.works?.length && <ReplyWorks works={message.works} />}
            {thread && (
              <ThreadPreviewCard
                detail={detail}
                root={message}
                thread={thread}
                onOpen={() => onOpenThread?.(thread.id)}
              />
            )}
          </Flexbox>
        }
        titleAddon={
          <>
            {timestamp}
            <RelayLabel message={message} />
            {isRequest && !delivery && <MessageFailureMark detail={detail} message={message} />}
          </>
        }
      />
      {hasToolbar && (
        // Icon-only, like a chat app's hover toolbar; rarer actions sit behind "more".
        <div {...stylex.props(styles.messageToolbar)}>
          {onReply && (
            <ActionIcon
              aria-label={t('reply.action')}
              icon={Reply}
              size="small"
              title={t('reply.action')}
              onClick={() => onReply(message)}
            />
          )}
          {canBranch && (
            <ActionIcon
              aria-label={t('startThread')}
              icon={GitBranch}
              size="small"
              title={t('startThread')}
              onClick={startThread}
            />
          )}
          {moreItems.length > 0 && (
            <DropdownMenu items={moreItems}>
              <ActionIcon
                aria-label={t('more', { ns: 'common' })}
                icon={MoreHorizontal}
                size="small"
                title={t('more', { ns: 'common' })}
              />
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
};

export function ThreadRootMessage({
  detail,
  root,
  onReply,
  highlighted,
}: {
  detail: ChannelDetail;
  root: ChannelPublicMessage;
  onReply?: (message: ChannelPublicMessage) => void;
  highlighted?: boolean;
}) {
  const { t } = useTranslation('channel');
  return (
    <Flexbox>
      <ChannelMessage
        isRoot
        detail={detail}
        highlighted={highlighted}
        message={root}
        onReply={onReply}
      />
      <Divider>
        <Flexbox horizontal align="center" gap={6} {...stylex.props(styles.muted)}>
          <Icon icon={GitBranch} size={12} />
          {t('threadDivider')}
        </Flexbox>
      </Divider>
    </Flexbox>
  );
}
