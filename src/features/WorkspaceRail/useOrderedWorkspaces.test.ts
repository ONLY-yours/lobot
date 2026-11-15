import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useOrderedWorkspaces } from './useOrderedWorkspaces';

const mocks = vi.hoisted(() => ({
  order: undefined as string[] | undefined,
  toastError: vi.fn(),
  updatePreference: vi.fn(async (_patch: unknown) => {}),
  workspaces: [] as { id: string }[],
}));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@lobehub/ui', () => ({ toast: { error: mocks.toastError } }));
vi.mock('@/business/client/hooks/useWorkspaces', () => ({ useWorkspaces: () => mocks.workspaces }));
vi.mock('@/store/user', () => ({
  useUserStore: (selector: (s: unknown) => unknown) =>
    selector({
      preference: { workspace: mocks.order ? { order: mocks.order } : undefined },
      updatePreference: mocks.updatePreference,
    }),
}));

const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe('useOrderedWorkspaces', () => {
  beforeEach(() => {
    mocks.order = undefined;
    mocks.workspaces = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the server order until the user rearranges', () => {
    const { result } = renderHook(() => useOrderedWorkspaces());
    expect(ids(result.current.workspaces)).toEqual(['a', 'b', 'c']);
  });

  it('follows the order in the user preference', () => {
    mocks.order = ['c', 'b', 'a'];

    const { result } = renderHook(() => useOrderedWorkspaces());
    expect(ids(result.current.workspaces)).toEqual(['c', 'b', 'a']);
  });

  it('saves a new order to the user preference', () => {
    const { result } = renderHook(() => useOrderedWorkspaces());

    act(() => result.current.reorder(['c', 'a', 'b']));

    expect(mocks.updatePreference).toHaveBeenCalledWith({ workspace: { order: ['c', 'a', 'b'] } });
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('tells the user when the order could not be saved', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.updatePreference.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useOrderedWorkspaces());

    await act(async () => result.current.reorder(['b', 'a', 'c']));

    expect(mocks.toastError).toHaveBeenCalledWith('workspaceRail.reorderError');
    error.mockRestore();
  });
});
