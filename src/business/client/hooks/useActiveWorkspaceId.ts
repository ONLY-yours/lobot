import { getWorkspaceStoreState, useWorkspaceStore } from '../workspace/store';

export const getActiveWorkspaceId = (): string | null => getWorkspaceStoreState().activeWorkspaceId;

export const useActiveWorkspaceId = (): string | null =>
  useWorkspaceStore((s) => s.activeWorkspaceId);
