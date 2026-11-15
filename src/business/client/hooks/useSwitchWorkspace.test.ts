import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readLastWorkspaceId, useWorkspaceStore } from '../workspace/store';
import { useSwitchWorkspace } from './useSwitchWorkspace';

const user = vi.hoisted(() => ({
  state: {
    preference: { lastWorkspaceId: null as string | null },
    updatePreference: vi.fn(async () => {}),
    user: { id: 'user-1' },
  },
}));

vi.mock('@/store/user', () => ({ getUserStoreState: () => user.state }));
vi.mock('@/store/user/selectors', () => ({
  userProfileSelectors: { userId: (s: typeof user.state) => s.user.id },
}));
vi.mock('@/libs/trpc/client', () => ({ lambdaClient: {} }));

describe('useSwitchWorkspace', () => {
  beforeEach(() => {
    localStorage.clear();
    user.state.preference.lastWorkspaceId = null;
    user.state.updatePreference.mockClear();
    useWorkspaceStore.setState({ activeWorkspaceId: null });
  });

  // The local copy alone was lost when the app quit within seconds of a switch.
  it('remembers the picked workspace in the user preference right away', async () => {
    const { result } = renderHook(() => useSwitchWorkspace());

    await result.current.switchWorkspace('ws-a');

    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('ws-a');
    expect(user.state.updatePreference).toHaveBeenCalledWith({ lastWorkspaceId: 'ws-a' });
    expect(readLastWorkspaceId('user-1')).toBe('ws-a');
  });

  it('remembers the personal space as null', async () => {
    user.state.preference.lastWorkspaceId = 'ws-a';
    useWorkspaceStore.setState({ activeWorkspaceId: 'ws-a' });
    const { result } = renderHook(() => useSwitchWorkspace());

    await result.current.switchToPersonal();

    expect(useWorkspaceStore.getState().activeWorkspaceId).toBeNull();
    expect(user.state.updatePreference).toHaveBeenCalledWith({ lastWorkspaceId: null });
  });

  it('skips the preference write when it already holds the pick', async () => {
    user.state.preference.lastWorkspaceId = 'ws-a';
    const { result } = renderHook(() => useSwitchWorkspace());

    await result.current.switchWorkspace('ws-a');

    expect(user.state.updatePreference).not.toHaveBeenCalled();
  });
});
