import type { WorkspaceMemberItem } from '@lobechat/database/schemas';

import { useWorkspaceStore } from '../workspace/store';
import { useFetchWorkspaceMembers } from './useFetchWorkspaceMembers';

export interface WorkspaceMemberUserProfile {
  avatar?: string | null;
  email?: string | null;
  fullName?: string | null;
  username?: string | null;
}

/** Membership row enriched with the member's display profile (`workspaceMember.list`). */
export type WorkspaceMemberWithProfile = WorkspaceMemberItem & {
  user?: WorkspaceMemberUserProfile | null;
};

/**
 * Members of the active workspace. Reading them also loads them, so a caller such as the
 * Contacts author column never shows "unknown author" just because nothing fetched the list.
 */
export const useWorkspaceMembers = (): WorkspaceMemberWithProfile[] => {
  useFetchWorkspaceMembers();
  return useWorkspaceStore((s) => s.members);
};

/** Non-hook snapshot of the same list, for imperative callers such as tool executors. */
export const getWorkspaceMembers = (): WorkspaceMemberWithProfile[] =>
  useWorkspaceStore.getState().members;
