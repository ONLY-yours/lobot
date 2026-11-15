import type { ChannelDetail, ChannelListItem } from '@lobechat/types';

import { isTrpcErrorCode } from '@/utils/trpcError';

/** The Channel was removed, is out of reach (another workspace, revoked access) or never existed. */
export const isChannelGone = (error: unknown) =>
  isTrpcErrorCode(error, 'BAD_REQUEST') ||
  isTrpcErrorCode(error, 'NOT_FOUND') ||
  isTrpcErrorCode(error, 'FORBIDDEN') ||
  isTrpcErrorCode(error, 'UNAUTHORIZED');

/** Retain content during transport failures, but hide it once access is revoked. */
export const visibleChannelDetail = (cached: ChannelDetail | undefined, error: unknown) =>
  isChannelGone(error) ? undefined : cached;

/**
 * Inviting needs an admin of an open Channel; archived Channels take no new members until
 * reopened. Inviting from a direct conversation starts a new group instead of joining it.
 */
export const canInviteMembers = (channel: Pick<ChannelListItem, 'canDelete' | 'status'>) =>
  channel.canDelete && channel.status !== 'archived';

/** Changing where an Agent runs follows the same rule as inviting: an admin of an open Channel. */
export const canManageAgents = canInviteMembers;
