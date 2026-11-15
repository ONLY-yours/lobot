import { stableWorkspaceAwareNavigate } from '@/features/Workspace/stableWorkspaceAwareNavigate';
import { type WorkspaceAwareNavigateOptions } from '@/features/Workspace/workspaceAwarePath';

export type AppNavigateOptions = WorkspaceAwareNavigateOptions;

export const appNavigate = (to: string, opts: AppNavigateOptions = {}): void => {
  stableWorkspaceAwareNavigate(to, opts);
};
