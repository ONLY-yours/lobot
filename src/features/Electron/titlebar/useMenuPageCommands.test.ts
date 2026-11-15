import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useElectronStore } from '@/store/electron';

import { useMenuPageCommands } from './useMenuPageCommands';

const mocks = vi.hoisted(() => ({
  appNavigate: vi.fn(),
  closeWindow: vi.fn(),
  handlers: new Map<string, (data?: any) => void>(),
}));

vi.mock('@lobechat/electron-client-ipc', () => ({
  useWatchBroadcast: (event: string, handler: (data?: any) => void) => {
    mocks.handlers.set(event, handler);
  },
}));

vi.mock('@/features/Electron/navigation/appNavigate', () => ({ appNavigate: mocks.appNavigate }));

vi.mock('@/services/electron/system', () => ({
  electronSystemService: { closeWindow: mocks.closeWindow },
}));

describe('useMenuPageCommands', () => {
  beforeEach(() => {
    mocks.handlers.clear();
    vi.clearAllMocks();
    useElectronStore.setState({ activeTabId: 'only', tabs: [] });
  });

  it('closes the window on Cmd+W instead of closing a tab', () => {
    renderHook(() => useMenuPageCommands());

    mocks.handlers.get('closeCurrentTabOrWindow')!();

    expect(mocks.closeWindow).toHaveBeenCalledTimes(1);
  });

  it('opens Preferences in the current page without creating a tab', () => {
    renderHook(() => useMenuPageCommands());

    mocks.handlers.get('createNewTab')!({ path: '/settings' });

    expect(mocks.appNavigate).toHaveBeenCalledWith('/settings');
    expect(useElectronStore.getState().tabs).toEqual([]);
  });

  it('ignores a bare new-tab command', () => {
    renderHook(() => useMenuPageCommands());

    mocks.handlers.get('createNewTab')!();

    expect(mocks.appNavigate).not.toHaveBeenCalled();
  });
});
