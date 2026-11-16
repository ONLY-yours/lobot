import type { ChannelDetail, ChannelPublicMessage, ChannelPublicThread } from '@lobechat/types';
import { Avatar, Icon } from '@lobehub/ui';
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ChevronRight, CornerDownRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import AgentAvatar from '@/components/AgentAvatar';
import UserAvatar from '@/features/User/UserAvatar';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { activityLabel } from './activityLabel';
import { memberJobStatus, workingJob } from './jobStatus';
import { authorAvatar, isCurrentUserAuthor, memberAvatar, memberName } from './memberName';
import { activityStyles } from './styles';
import { threadTitle } from './threadTitle';
import { TypingDots } from './TypingDots';

dayjs.extend(relativeTime);

const styles = stylex.create({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignSelf: 'flex-start',
    width: '100%',
    maxWidth: 520,
    // Sit close to the message it continues: the body's 8px gap plus the paragraph's trailing
    // margin left the card looking detached.
    marginBlockStart: -6,
    marginBlockEnd: 0,
    marginInline: 0,
    paddingBlock: 6,
    paddingInline: 10,
    // A quiet fill instead of a bordered box: the card follows the message, it is not a new one.
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: cssVar.borderRadius,
    font: 'inherit',
    textAlign: 'start',
    backgroundColor: {
      'default': cssVar.colorFillQuaternary,
      ':hover': cssVar.colorFillTertiary,
    },
    cursor: 'pointer',
  },
  row: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    minWidth: 0,
  },
  // Indented past the glyph column (16px glyph + 6px gap) so the avatar lines up with the title.
  replyRow: {
    paddingInlineStart: 22,
  },
  threadIcon: {
    display: 'inline-flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    color: cssVar.colorTextSecondary,
  },
  title: {
    overflow: 'hidden',
    minWidth: 0,
    fontSize: 13,
    fontWeight: 500,
    color: cssVar.colorText,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  count: {
    display: 'inline-flex',
    flexShrink: 0,
    alignItems: 'center',
    fontSize: 12,
    color: cssVar.colorTextSecondary,
  },
  author: {
    flexShrink: 0,
    maxWidth: 160,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: 500,
    color: cssVar.colorTextSecondary,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  preview: {
    overflow: 'hidden',
    flex: '1',
    minWidth: 0,
    fontSize: 12,
    color: cssVar.colorTextSecondary,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  working: {
    overflow: 'hidden',
    minWidth: 0,
    fontSize: 12,
    color: cssVar.colorTextSecondary,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  time: {
    flexShrink: 0,
    fontSize: 12,
    color: cssVar.colorTextTertiary,
    whiteSpace: 'nowrap',
    // ChatItem hides every `time` inside a message until hover; this one is content, not a stamp.
    opacity: 1,
  },
});

/**
 * A message's thread as a card under it: what it is about, how much was said, and the latest
 * word, or who is working in it right now.
 */
export const ThreadPreviewCard = ({
  detail,
  onOpen,
  root,
  thread,
}: {
  detail: Pick<ChannelDetail, 'jobs' | 'members'>;
  onOpen?: () => void;
  root: ChannelPublicMessage;
  thread: ChannelPublicThread;
}) => {
  const { t } = useTranslation('channel');
  const { lastReply, replyCount } = thread;
  const job = workingJob((detail.jobs ?? []).filter((entry) => entry.threadId === thread.id));
  const worker = job && (detail.members ?? []).find((member) => member.id === job.memberId);
  const workerName = job && memberName(worker, t('unnamedAgent'));
  // Same rule as the message header: the viewer's own replies use their live avatar.
  const isOwnReply = useUserStore(
    (s) => !!lastReply && isCurrentUserAuthor(lastReply.author, userProfileSelectors.userId(s)),
  );
  return (
    <button type="button" {...stylex.props(styles.card)} onClick={onOpen}>
      <span {...stylex.props(styles.row)}>
        {/* The sidebar's thread glyph, not a branch. */}
        <span {...stylex.props(styles.threadIcon)}>
          <Icon icon={CornerDownRight} size={14} />
        </span>
        <span {...stylex.props(styles.title)}>{threadTitle(root, thread) ?? t('thread')}</span>
        <span {...stylex.props(styles.count)}>
          {/* Views cached before thread summaries existed only know that the thread exists. */}
          {replyCount ? t('threadCard.messages', { count: replyCount }) : t('openThread')}
          <Icon icon={ChevronRight} size={12} />
        </span>
      </span>
      {job ? (
        // The reply on its way is newer than the last one posted, so it takes that row.
        <span role="status" {...stylex.props(styles.row, styles.replyRow)}>
          <AgentAvatar
            agentId={worker?.agentId}
            avatar={memberAvatar(worker)}
            name={workerName}
            shape={'circle'}
            size={16}
            title={workerName}
          />
          <span {...stylex.props(styles.working)}>
            {activityLabel(
              t('activity.one', { name: workerName, status: t(memberJobStatus(job)) }),
            )}
          </span>
          <span {...stylex.props(activityStyles.line, styles.count)}>
            <TypingDots />
          </span>
        </span>
      ) : (
        lastReply && (
          <span {...stylex.props(styles.row, styles.replyRow)}>
            {isOwnReply ? (
              <UserAvatar shape="circle" size={16} />
            ) : (
              <Avatar
                avatar={authorAvatar(lastReply.author)}
                shape="circle"
                size={16}
                title={lastReply.author.name ?? undefined}
              />
            )}
            <span {...stylex.props(styles.author)}>
              {lastReply.author.name || t('deletedMember')}
            </span>
            <span {...stylex.props(styles.preview)}>
              {lastReply.content.split('\n')[0] || t('reply.attachment')}
            </span>
            <time
              dateTime={new Date(lastReply.createdAt).toISOString()}
              {...stylex.props(styles.time)}
            >
              {dayjs(lastReply.createdAt).fromNow()}
            </time>
          </span>
        )
      )}
    </button>
  );
};
