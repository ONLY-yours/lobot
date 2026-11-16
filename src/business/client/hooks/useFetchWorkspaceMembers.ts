import { useFetchWorkspaceMembersList, useWorkspaceStore } from '../workspace/store';

export interface FetchWorkspaceMembersOptions {
  includeDeleted?: boolean;
}

/** Loads the active workspace's members; `useWorkspaceMembers` reads them. */
export const useFetchWorkspaceMembers = (options: FetchWorkspaceMembersOptions = {}) => {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data, isLoading } = useFetchWorkspaceMembersList(workspaceId, options);
  return { data: data ?? [], isLoading };
};
