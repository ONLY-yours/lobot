import { getActiveWorkspaceSlug } from '@/business/client/hooks/useActiveWorkspaceSlug';
import { buildWorkspaceAwarePath } from '@/features/Workspace/workspaceAwarePath';

import { navigateActiveTab } from './activeTabNavigate';
import type { AppNavigateOptions } from './appNavigate';

export const appNavigate = (to: string, opts: AppNavigateOptions = {}): void => {
  const { escape, ...navOptions } = opts;
  const resolved = buildWorkspaceAwarePath(to, getActiveWorkspaceSlug(), { escape });

  navigateActiveTab(resolved, navOptions);
};
