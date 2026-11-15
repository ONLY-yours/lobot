/**
 * @vitest-environment happy-dom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BrowserPane from './index';

const { importChromeLoginData, reload, toastSuccess } = vi.hoisted(() => ({
  importChromeLoginData: vi.fn(),
  reload: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('@lobechat/const', () => ({ isDesktop: true }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@lobehub/ui', () => ({
  ActionIcon: ({ title }: { title?: string }) => createElement('button', {}, title),
  Center: () => null,
  createStaticStyles: () => new Proxy({}, { get: (_, key) => String(key) }),
  // Renders the trigger and lists the menu flat so each action can be read and clicked.
  DropdownMenu: ({ children, items }: { children?: unknown; items: any[] }) =>
    createElement(
      'div',
      {},
      children as never,
      createElement(
        'ul',
        {},
        items.map((item) =>
          createElement('li', { key: item.key, onClick: item.onClick }, item.label),
        ),
      ),
    ),
  Empty: () => null,
  Flexbox: ({ children }: { children?: unknown }) => createElement('div', {}, children as never),
  Input: () => null,
  toast: { error: vi.fn(), success: toastSuccess },
}));
vi.mock('@/services/electron/browserSidebar', () => ({
  electronBrowserSidebarService: {
    cancelElementPick: vi.fn(async () => ({ success: true })),
    importChromeLoginData,
    reload,
    setOverlayLabels: vi.fn(async () => {}),
  },
}));
vi.mock('@/services/electron/browserWebviewRegistry', () => ({
  browserWebviewRegistry: { attach: vi.fn(async () => {}), detach: vi.fn(async () => {}) },
}));
vi.mock('./useBrowserSidebarState', () => ({
  useBrowserSidebarState: () => ({
    attached: true,
    canGoBack: false,
    canGoForward: false,
    isLoading: false,
    title: '',
    url: 'https://github.com',
  }),
}));
vi.mock('@/store/global', () => ({
  useGlobalStore: (selector: (state: unknown) => unknown) =>
    selector({ clearBrowserTabRequest: () => {}, status: {} }),
}));
vi.mock('@/store/chat', () => ({ useChatStore: { getState: () => ({}) } }));
vi.mock('@/store/file', () => ({ useFileStore: { getState: () => ({}) } }));

const renderPane = () =>
  render(
    createElement(BrowserPane, {
      composerTarget: { contextKey: 'ctx', writable: true } as never,
      sessionId: 'browser-1',
    }),
  );

describe('BrowserPane', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reload.mockResolvedValue({ success: true });
  });

  it('offers the Chrome login sync from the more menu instead of a banner', () => {
    renderPane();

    expect(screen.getByText('more')).toBeTruthy();
    expect(screen.getByText('workingPanel.browser.import.sync')).toBeTruthy();
    expect(screen.queryByText('workingPanel.browser.import.title')).toBeNull();
  });

  it('syncs Chrome login data and reloads the page each time it is picked', async () => {
    importChromeLoginData.mockResolvedValue({ importedCount: 3, success: true });
    renderPane();

    fireEvent.click(screen.getByText('workingPanel.browser.import.sync'));
    await waitFor(() => expect(reload).toHaveBeenCalledWith({ sessionId: 'browser-1' }));
    expect(toastSuccess).toHaveBeenCalledWith('workingPanel.browser.import.success');

    fireEvent.click(screen.getByText('workingPanel.browser.import.sync'));
    await waitFor(() => expect(importChromeLoginData).toHaveBeenCalledTimes(2));
  });
});
