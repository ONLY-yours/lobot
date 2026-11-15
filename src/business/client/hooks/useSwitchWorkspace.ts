import { getUserStoreState } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { useWorkspaceStore, writeLastWorkspaceId } from '../workspace/store';

export interface SwitchWorkspaceActions {
  switchToPersonal: () => Promise<void>;
  switchWorkspace: (id: string) => Promise<void>;
}

const rememberScope = (id: string | null) =>
  writeLastWorkspaceId(userProfileSelectors.userId(getUserStoreState()), id);

/**
 * Workspace switch invoked from imperative call sites that represent an
 * explicit user choice (e.g. switcher click, wizard landing, accept-invite,
 * post-leave redirect). Remembers the choice so a restart reopens it.
 */
export const useSwitchWorkspace = (): SwitchWorkspaceActions => {
  const { switchToPersonal, switchWorkspace } = useSilentSwitchWorkspace();
  return {
    switchToPersonal: async () => {
      rememberScope(null);
      await switchToPersonal();
    },
    switchWorkspace: async (id) => {
      rememberScope(id);
      await switchWorkspace(id);
    },
  };
};

/**
 * Workspace switch invoked from passive reconciliation sources (e.g. URL
 * sync) where the active workspace is being aligned with external state
 * rather than chosen by the user. Does not remember the choice.
 */
export const useSilentSwitchWorkspace = (): SwitchWorkspaceActions => {
  const switchToPersonal = useWorkspaceStore((s) => s.switchToPersonal);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);
  return {
    switchToPersonal: async () => switchToPersonal(),
    switchWorkspace: async (id) => switchWorkspace(id),
  };
};
