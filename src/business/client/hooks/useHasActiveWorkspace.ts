import { useWorkspaceStore } from '../workspace/store';

export const useHasActiveWorkspace = (): boolean =>
  useWorkspaceStore((s) => s.activeWorkspaceId !== null);
