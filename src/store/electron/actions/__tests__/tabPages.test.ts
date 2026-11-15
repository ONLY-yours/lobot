import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PERSONAL_TAB_SCOPE } from '@/features/Electron/titlebar/TabBar/scope';
import { getTabPages, saveTabPages } from '@/features/Electron/titlebar/TabBar/storage';
import { type TabItem } from '@/features/Electron/titlebar/TabBar/types';
import { useElectronStore } from '@/store/electron';
import { initialState } from '@/store/electron/initialState';

vi.mock('@/features/Electron/titlebar/TabBar/resolveRouteMeta', () => ({
  guardedMergeCache: (prev: TabItem['cached'], next: TabItem['cached']) => {
    if (!next) return prev;

    const merged: TabItem['cached'] = { ...prev };
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) continue;
      if (typeof value === 'string' && value.trim() === '') continue;
      merged[key as keyof NonNullable<TabItem['cached']>] = value;
    }

    return Object.keys(merged ?? {}).length > 0 ? merged : undefined;
  },
}));

const buildTab = (url: string, cached?: TabItem['cached']): TabItem => ({
  cached,
  id: url,
  lastVisited: 1,
  url,
});

describe('tabPages actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    useElectronStore.setState({ ...initialState, activeTabId: null, tabs: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addTab', () => {
    it('creates a tab with a stable generated id and activates it', () => {
      const { result } = renderHook(() => useElectronStore());

      let createdId = '';
      act(() => {
        createdId = result.current.addTab('/agent/abc?b=2&a=1');
      });

      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0].id).toBe(createdId);
      expect(result.current.tabs[0].url).toBe('/agent/abc?b=2&a=1');
      expect(result.current.activeTabScope).toEqual({ type: 'personal' });
      expect(result.current.activeTabId).toBe(createdId);
    });

    it('switches the visible tab bucket when the URL moves into a workspace', () => {
      const { result } = renderHook(() => useElectronStore());

      act(() => {
        result.current.addTab('/agent/abc');
        result.current.addTab('/acme/agent/abc');
      });

      expect(result.current.activeTabScope).toEqual({ slug: 'acme', type: 'workspace' });
      expect(result.current.tabs.map((page) => page.url)).toEqual(['/acme/agent/abc']);

      act(() => {
        result.current.loadTabs('/agent/abc');
      });

      expect(result.current.activeTabScope).toEqual({ type: 'personal' });
      expect(result.current.tabs.map((page) => page.url)).toEqual(['/agent/abc']);
    });

    it('dedupes tabs that resolve to the same normalized URL', () => {
      const { result } = renderHook(() => useElectronStore());

      act(() => {
        result.current.addTab('/agent/abc?a=1&b=2');
        result.current.addTab('/agent/abc?b=2&a=1');
      });

      expect(result.current.tabs).toHaveLength(1);
    });

    it('treats a trailing slash as the same identity', () => {
      const { result } = renderHook(() => useElectronStore());

      act(() => {
        result.current.addTab('/agent/abc');
        result.current.addTab('/agent/abc/');
      });

      expect(result.current.tabs).toHaveLength(1);
    });

    it('replaces the current tab instead of opening a second one', () => {
      const { result } = renderHook(() => useElectronStore());

      let first = '';
      let second = '';
      act(() => {
        first = result.current.addTab('/agent/abc');
        second = result.current.addTab('/agent/def');
      });

      expect(second).not.toBe(first);
      expect(result.current.tabs.map((tab) => tab.url)).toEqual(['/agent/def']);
      expect(result.current.activeTabId).toBe(second);
      expect(getTabPages(PERSONAL_TAB_SCOPE).tabs.map((tab) => tab.url)).toEqual(['/agent/def']);
    });
  });

  describe('loadTabs', () => {
    it('keeps only the active tab from a bucket the multi-tab strip persisted', () => {
      const { result } = renderHook(() => useElectronStore());
      const a = { ...buildTab('/agent/a'), lastVisited: 3 };
      const b = { ...buildTab('/agent/b'), lastVisited: 1 };
      saveTabPages(PERSONAL_TAB_SCOPE, [a, b], b.id);

      act(() => {
        result.current.loadTabs('/');
      });

      expect(result.current.tabs).toEqual([b]);
      expect(result.current.activeTabId).toBe(b.id);
    });

    it('falls back to the most recently visited tab when the stored active id is stale', () => {
      const { result } = renderHook(() => useElectronStore());
      const a = { ...buildTab('/agent/a'), lastVisited: 1 };
      const b = { ...buildTab('/agent/b'), lastVisited: 5 };
      saveTabPages(PERSONAL_TAB_SCOPE, [a, b], 'gone');

      act(() => {
        result.current.loadTabs('/');
      });

      expect(result.current.tabs).toEqual([b]);
      expect(result.current.activeTabId).toBe(b.id);
    });
  });

  describe('updateTab', () => {
    it('drops cached data when the tab navigates to a different page but keeps the id stable', () => {
      const { result } = renderHook(() => useElectronStore());
      const agentTab = buildTab('/agent/abc', { title: 'Claude Code' });

      act(() => {
        useElectronStore.setState({ activeTabId: agentTab.id, tabs: [agentTab] });
      });

      act(() => {
        result.current.updateTab(agentTab.id, '/');
      });

      const updatedTab = result.current.tabs[0];
      expect(updatedTab.id).toBe(agentTab.id);
      expect(updatedTab.url).toBe('/');
      expect(updatedTab.cached).toBeUndefined();
      expect(result.current.activeTabId).toBe(agentTab.id);
    });

    it('keeps a tab in the current bucket when updateTab receives a workspace URL directly', () => {
      const { result } = renderHook(() => useElectronStore());
      const agentTab = buildTab('/agent/abc', { title: 'Claude Code' });

      act(() => {
        useElectronStore.setState({ activeTabId: agentTab.id, tabs: [agentTab] });
      });

      act(() => {
        result.current.updateTab(agentTab.id, '/acme/agent/abc');
      });

      expect(result.current.activeTabScope).toEqual({ type: 'personal' });
      expect(result.current.tabs[0].url).toBe('/acme/agent/abc');
      expect(result.current.tabs[0].cached).toBeUndefined();
    });

    it('keeps cached data when the normalized URL is unchanged', () => {
      const { result } = renderHook(() => useElectronStore());
      const agentTab = buildTab('/agent/abc?a=1', { title: 'Claude Code' });

      act(() => {
        useElectronStore.setState({ activeTabId: agentTab.id, tabs: [agentTab] });
      });

      act(() => {
        result.current.updateTab(agentTab.id, '/agent/abc?a=1');
      });

      expect(result.current.tabs[0].cached).toEqual({ title: 'Claude Code' });
    });

    it('does nothing when the tab id is not found', () => {
      const { result } = renderHook(() => useElectronStore());
      const agentTab = buildTab('/agent/abc');

      act(() => {
        useElectronStore.setState({ activeTabId: agentTab.id, tabs: [agentTab] });
      });

      act(() => {
        result.current.updateTab('non-existent', '/');
      });

      expect(result.current.tabs).toEqual([agentTab]);
      expect(result.current.activeTabId).toBe(agentTab.id);
    });
  });

  describe('reportTabLocation', () => {
    it('rewrites the active tab url when the reported url stays in scope', () => {
      const { result } = renderHook(() => useElectronStore());
      const tab = buildTab('/agent/abc');

      act(() => {
        useElectronStore.setState({
          activeTabId: tab.id,
          activeTabScope: PERSONAL_TAB_SCOPE,
          tabs: [tab],
        });
      });

      act(() => {
        result.current.reportTabLocation(tab.id, '/agent/def');
      });

      expect(result.current.activeTabScope).toEqual({ type: 'personal' });
      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0].id).toBe(tab.id);
      expect(result.current.tabs[0].url).toBe('/agent/def');
    });

    it('swaps scope, keeps the navigating tab at its pre-nav url in the old scope, and activates a tab in the new scope', () => {
      const { result } = renderHook(() => useElectronStore());
      const personalTab = buildTab('/agent/abc');

      act(() => {
        useElectronStore.setState({
          activeTabId: personalTab.id,
          activeTabScope: PERSONAL_TAB_SCOPE,
          tabs: [personalTab],
        });
      });

      act(() => {
        result.current.reportTabLocation(personalTab.id, '/acme/agent/xyz');
      });

      expect(result.current.activeTabScope).toEqual({ slug: 'acme', type: 'workspace' });
      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0].url).toBe('/acme/agent/xyz');
      expect(result.current.activeTabId).toBe(result.current.tabs[0].id);

      const persistedPersonal = getTabPages(PERSONAL_TAB_SCOPE);
      expect(persistedPersonal.tabs.map((t) => t.url)).toEqual(['/agent/abc']);
      expect(persistedPersonal.activeTabId).toBe(personalTab.id);
    });

    it('reuses an existing tab in the target scope instead of duplicating it', () => {
      const { result } = renderHook(() => useElectronStore());
      const acmeScope = { slug: 'acme', type: 'workspace' } as const;
      const existing = buildTab('/acme/agent/xyz');
      saveTabPages(acmeScope, [existing], existing.id);

      const personalTab = buildTab('/agent/abc');
      act(() => {
        useElectronStore.setState({
          activeTabId: personalTab.id,
          activeTabScope: PERSONAL_TAB_SCOPE,
          tabs: [personalTab],
        });
      });

      act(() => {
        result.current.reportTabLocation(personalTab.id, '/acme/agent/xyz');
      });

      expect(result.current.activeTabScope).toEqual(acmeScope);
      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0].id).toBe(existing.id);
      expect(result.current.activeTabId).toBe(existing.id);
    });

    it('does nothing when the reported tab id is not found', () => {
      const { result } = renderHook(() => useElectronStore());
      const tab = buildTab('/agent/abc');

      act(() => {
        useElectronStore.setState({
          activeTabId: tab.id,
          activeTabScope: PERSONAL_TAB_SCOPE,
          tabs: [tab],
        });
      });

      act(() => {
        result.current.reportTabLocation('non-existent', '/acme/agent/xyz');
      });

      expect(result.current.activeTabScope).toEqual({ type: 'personal' });
      expect(result.current.tabs).toEqual([tab]);
    });
  });

  describe('snapshotTabLocation', () => {
    it('persists a fragment-only move so an evicted tab cold-restores at its anchor', () => {
      const { result } = renderHook(() => useElectronStore());
      const settingsTab = buildTab('/settings/agent', { title: 'Settings' });

      act(() => {
        useElectronStore.setState({ activeTabId: settingsTab.id, tabs: [settingsTab] });
      });

      act(() => {
        result.current.snapshotTabLocation(settingsTab.id, '/settings/agent#llm');
      });

      expect(result.current.tabs[0].url).toBe('/settings/agent#llm');
      expect(result.current.tabs[0].cached).toEqual({ title: 'Settings' });
      expect(result.current.tabs[0].lastVisited).toBe(settingsTab.lastVisited);
    });

    it('drops cached data when the snapshot lands on a different page', () => {
      const { result } = renderHook(() => useElectronStore());
      const agentTab = buildTab('/agent/abc', { title: 'Claude Code' });

      act(() => {
        useElectronStore.setState({ activeTabId: agentTab.id, tabs: [agentTab] });
      });

      act(() => {
        result.current.snapshotTabLocation(agentTab.id, '/memory');
      });

      expect(result.current.tabs[0].url).toBe('/memory');
      expect(result.current.tabs[0].cached).toBeUndefined();
    });

    it('does nothing when the snapshot repeats the stored url', () => {
      const { result } = renderHook(() => useElectronStore());
      const agentTab = buildTab('/agent/abc', { title: 'Claude Code' });

      act(() => {
        useElectronStore.setState({ activeTabId: agentTab.id, tabs: [agentTab] });
      });

      const before = result.current.tabs;

      act(() => {
        result.current.snapshotTabLocation(agentTab.id, '/agent/abc');
      });

      expect(result.current.tabs).toBe(before);
    });
  });

  describe('updateTabCache (guarded merge)', () => {
    it('skips undefined and empty-string fields, never clobbering a good value', () => {
      const { result } = renderHook(() => useElectronStore());
      const agentTab = buildTab('/agent/abc', {
        avatar: 'avatar.png',
        title: 'Claude Code',
      });

      act(() => {
        useElectronStore.setState({ activeTabId: agentTab.id, tabs: [agentTab] });
      });

      act(() => {
        result.current.updateTabCache(agentTab.id, { avatar: '', title: undefined });
      });

      expect(result.current.tabs[0].cached).toEqual({
        avatar: 'avatar.png',
        title: 'Claude Code',
      });
    });

    it('only writes defined non-empty fields', () => {
      const { result } = renderHook(() => useElectronStore());
      const agentTab = buildTab('/agent/abc', { title: 'Old Title' });

      act(() => {
        useElectronStore.setState({ activeTabId: agentTab.id, tabs: [agentTab] });
      });

      act(() => {
        result.current.updateTabCache(agentTab.id, { avatar: 'a.png', title: 'New Title' });
      });

      expect(result.current.tabs[0].cached).toEqual({
        avatar: 'a.png',
        title: 'New Title',
      });
    });
  });
});
