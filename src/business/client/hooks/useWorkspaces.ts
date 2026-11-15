import { useWorkspaceStore } from '../workspace/store';
import type { WorkspaceListItem } from './useActiveWorkspace';

export const useWorkspaces = (): WorkspaceListItem[] => useWorkspaceStore((s) => s.workspaces);
