import { useWorkspaceStore } from '../workspace/store';

export const useHasWorkspace = (): boolean => useWorkspaceStore((s) => s.workspaces.length > 0);
