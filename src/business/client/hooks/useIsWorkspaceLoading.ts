import { useWorkspaceStore } from '../workspace/store';

export const useIsWorkspaceLoading = (): boolean => useWorkspaceStore((s) => s.isWorkspaceLoading);
