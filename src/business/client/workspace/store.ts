'use client';

import { useLayoutEffect } from 'react';
import useSWR, { type SWRResponse } from 'swr';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import type { WorkspaceListItem } from '../hooks/useActiveWorkspace';

/**
 * The workspace context Lobot sends to the server. LobeHub Cloud keeps it in the
 * URL (`/:workspaceSlug/...`), but Lobot has no workspace routes, so the active
 * workspace lives here and reaches the server as the `X-Workspace-Id` header
 * (`trpc-headers.ts`). SWR and replica caches follow it through
 * `getActiveWorkspaceId`, so scoped data refetches on a switch by itself.
 */
export interface WorkspaceState {
  activeWorkspaceId: string | null;
  isWorkspaceLoading: boolean;
  workspaces: WorkspaceListItem[];
}

interface WorkspaceActions {
  switchToPersonal: () => void;
  switchWorkspace: (id: string) => void;
}

export type WorkspaceStore = WorkspaceState & WorkspaceActions;

export const FETCH_WORKSPACES_KEY = 'workspace/list';

/** The last scope the user picked, per user, so a restart reopens it. */
const lastWorkspaceKey = (userId: string) => `lobot:last-workspace:${userId}`;

export const readLastWorkspaceId = (userId: string): string | null => {
  try {
    return localStorage.getItem(lastWorkspaceKey(userId));
  } catch {
    return null;
  }
};

export const writeLastWorkspaceId = (userId: string | null | undefined, id: string | null) => {
  if (!userId) return;
  try {
    if (id) localStorage.setItem(lastWorkspaceKey(userId), id);
    else localStorage.removeItem(lastWorkspaceKey(userId));
  } catch {
    // best-effort
  }
};

export const useWorkspaceStore = createWithEqualityFn<WorkspaceStore>()(
  (set, get) => ({
    activeWorkspaceId: null,
    // Loading until the first list settles, so nothing paints a scope it may leave.
    isWorkspaceLoading: true,
    switchToPersonal: () => {
      if (get().activeWorkspaceId !== null) set({ activeWorkspaceId: null });
    },
    switchWorkspace: (id) => {
      if (get().activeWorkspaceId !== id) set({ activeWorkspaceId: id });
    },
    workspaces: [],
  }),
  shallow,
);

export const getWorkspaceStoreState = () => useWorkspaceStore.getState();

/**
 * A locked-out membership (lapsed subscription) cannot be entered, so it is
 * neither listed nor restored.
 */
const enterable = (workspaces: WorkspaceListItem[]) => workspaces.filter((ws) => !ws.lockedOut);

/**
 * Loads the user's workspaces once signed in and restores the last scope they
 * picked. `enabled` is `undefined` while sign-in is still resolving.
 */
export const useFetchWorkspaces = (
  enabled: boolean | undefined,
  userId: string | null | undefined,
): SWRResponse<WorkspaceListItem[]> => {
  const swr = useSWR<WorkspaceListItem[]>(
    enabled && userId ? [FETCH_WORKSPACES_KEY, userId] : null,
    async () => {
      // Lazy: hooks that read this store sit under the tRPC client's own imports.
      const { lambdaClient } = await import('@/libs/trpc/client');
      return (await lambdaClient.workspace.list.query()) as WorkspaceListItem[];
    },
    {
      onSuccess: (data) => {
        const workspaces = enterable(data ?? []);
        const { activeWorkspaceId } = useWorkspaceStore.getState();
        const candidate = activeWorkspaceId ?? (userId ? readLastWorkspaceId(userId) : null);
        // A workspace the user lost access to falls back to the personal space.
        const active = candidate && workspaces.some((ws) => ws.id === candidate) ? candidate : null;
        useWorkspaceStore.setState({ activeWorkspaceId: active, workspaces });
      },
    },
  );

  const { error, isLoading } = swr;
  useLayoutEffect(() => {
    if (enabled === undefined) return;
    if (!enabled) {
      useWorkspaceStore.setState({
        activeWorkspaceId: null,
        isWorkspaceLoading: false,
        workspaces: [],
      });
      return;
    }
    // A server without workspaces (self-hosted) errors here; stay personal.
    useWorkspaceStore.setState({ isWorkspaceLoading: isLoading && !error });
  }, [enabled, error, isLoading]);

  return swr;
};
