import { toast } from '@lobehub/ui';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { WorkspaceListItem } from '@/business/client/hooks/useActiveWorkspace';
import { useWorkspaces } from '@/business/client/hooks/useWorkspaces';
import { useUserStore } from '@/store/user';

import { sortByWorkspaceOrder } from './workspaceOrder';

/**
 * The user's workspaces in their own rail order, and a way to save a new one.
 * Workspaces are shared; the order is the user's, kept in their preference.
 */
export const useOrderedWorkspaces = (): {
  reorder: (order: string[]) => void;
  workspaces: WorkspaceListItem[];
} => {
  const { t } = useTranslation('common');
  const workspaces = useWorkspaces();
  const order = useUserStore((s) => s.preference?.workspace?.order);
  const updatePreference = useUserStore((s) => s.updatePreference);

  const ordered = useMemo(() => sortByWorkspaceOrder(workspaces, order), [order, workspaces]);

  const reorder = useCallback(
    (next: string[]) => {
      // The store applies it at once; the save runs behind it.
      updatePreference({ workspace: { order: next } }).catch((error) => {
        console.error('[workspaceRail] failed to save the order', error);
        toast.error(t('workspaceRail.reorderError'));
      });
    },
    [t, updatePreference],
  );

  return { reorder, workspaces: ordered };
};
