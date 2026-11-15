import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getBusinessTrpcHeaders } from '../trpc-headers';
import {
  readLastWorkspaceId,
  useFetchWorkspaces,
  useWorkspaceStore,
  writeLastWorkspaceId,
} from './store';

const mocks = vi.hoisted(() => ({ list: vi.fn() }));

vi.mock('@/libs/trpc/client', () => ({
  lambdaClient: { workspace: { list: { query: mocks.list } } },
}));

const ws = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  name: id,
  slug: id,
  ...extra,
});

// A fresh SWR cache per test, so one test's list never answers another's.
const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(SWRConfig, { value: { provider: () => new Map() } }, children);

describe('workspace store', () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkspaceStore.setState({
      activeWorkspaceId: null,
      isWorkspaceLoading: true,
      workspaces: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists the workspaces and reopens the one picked last time', async () => {
    mocks.list.mockResolvedValue([ws('ws-a'), ws('ws-b')]);
    writeLastWorkspaceId('user-1', 'ws-b');

    renderHook(() => useFetchWorkspaces(true, 'user-1'), { wrapper });

    await waitFor(() => expect(useWorkspaceStore.getState().workspaces).toHaveLength(2));
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe('ws-b');
    expect(useWorkspaceStore.getState().isWorkspaceLoading).toBe(false);
  });

  it('falls back to the personal space when the last workspace is gone or locked out', async () => {
    mocks.list.mockResolvedValue([ws('ws-a'), ws('ws-locked', { lockedOut: true })]);
    writeLastWorkspaceId('user-1', 'ws-locked');

    renderHook(() => useFetchWorkspaces(true, 'user-1'), { wrapper });

    await waitFor(() => expect(useWorkspaceStore.getState().workspaces).toEqual([ws('ws-a')]));
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBeNull();
  });

  it('stays personal and stops loading when the server has no workspaces', async () => {
    mocks.list.mockRejectedValue(new Error('NOT_FOUND'));

    renderHook(() => useFetchWorkspaces(true, 'user-1'), { wrapper });

    await waitFor(() => expect(useWorkspaceStore.getState().isWorkspaceLoading).toBe(false));
    expect(useWorkspaceStore.getState().workspaces).toEqual([]);
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBeNull();
  });

  it('clears the context when signed out', () => {
    useWorkspaceStore.setState({ activeWorkspaceId: 'ws-a', workspaces: [ws('ws-a')] as never });

    renderHook(() => useFetchWorkspaces(false, null), { wrapper });

    expect(useWorkspaceStore.getState()).toMatchObject({
      activeWorkspaceId: null,
      isWorkspaceLoading: false,
      workspaces: [],
    });
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it('scopes requests to the active workspace through the X-Workspace-Id header', async () => {
    expect(await getBusinessTrpcHeaders()).toEqual({});

    act(() => useWorkspaceStore.getState().switchWorkspace('ws-a'));
    expect(await getBusinessTrpcHeaders()).toEqual({ 'X-Workspace-Id': 'ws-a' });

    act(() => useWorkspaceStore.getState().switchToPersonal());
    expect(await getBusinessTrpcHeaders()).toEqual({});
  });

  it('remembers the last scope per user', () => {
    writeLastWorkspaceId('user-1', 'ws-a');
    writeLastWorkspaceId('user-2', 'ws-b');
    expect(readLastWorkspaceId('user-1')).toBe('ws-a');

    writeLastWorkspaceId('user-1', null);
    expect(readLastWorkspaceId('user-1')).toBeNull();
    expect(readLastWorkspaceId('user-2')).toBe('ws-b');
  });
});
