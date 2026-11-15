import { getWorkspaceStoreState } from './workspace/store';

/** Scopes every tRPC request to the active workspace; none means the personal space. */
export const getBusinessTrpcHeaders = async (): Promise<Record<string, string>> => {
  const workspaceId = getWorkspaceStoreState().activeWorkspaceId;
  return workspaceId ? { 'X-Workspace-Id': workspaceId } : {};
};
