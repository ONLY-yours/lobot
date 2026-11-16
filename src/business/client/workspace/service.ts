import type { WorkspaceListItem } from '../hooks/useActiveWorkspace';
import type { WorkspaceMemberWithProfile } from '../hooks/useWorkspaceMembers';

// Lazy: the hooks reading the workspace store sit under the tRPC client's own imports.
const client = async () => (await import('@/libs/trpc/client')).lambdaClient;

/** The cloud workspace API (`workspace.*` on the LobeHub Cloud lambda router). */
export const workspaceService = {
  create: async (input: { name: string; slug: string }): Promise<WorkspaceListItem> =>
    (await client()).workspace.create.mutate(input) as Promise<WorkspaceListItem>,
  list: async (): Promise<WorkspaceListItem[]> =>
    (await client()).workspace.list.query() as Promise<WorkspaceListItem[]>,
  /** Members of the active workspace (the `X-Workspace-Id` header) with their profiles. */
  listMembers: async (input?: {
    includeDeleted?: boolean;
  }): Promise<WorkspaceMemberWithProfile[]> =>
    (await client()).workspaceMember.list.query(input) as Promise<WorkspaceMemberWithProfile[]>,
};
