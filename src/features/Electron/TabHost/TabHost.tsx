'use client';

import { createStaticStyles } from '@lobehub/ui';
import {
  Activity,
  type CSSProperties,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import { UNSAFE_LocationContext } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { createTabRouter } from '@/spa/router/tabRouter';
import { useElectronStore } from '@/store/electron';

import { useDisplayedTabStore } from './displayedTab';
import { flushHiddenTabRestores } from './hiddenTabRestore';
import { useLiveTabRouterCap } from './liveTabRouterCap';
import { resolveLiveTabIds } from './resolveLiveTabIds';
import { TabIdContext } from './TabIdContext';
import {
  getOrCreateTabRouter,
  getTabRouter,
  getTabRouterIds,
  syncTabRouters,
  type TabRouter,
} from './tabRouterManager';
import { useDisplayedTabIds } from './useDisplayedTabIds';

interface TabHostProps {
  createRouter?: (url: string) => TabRouter;
}

const rootStyle: CSSProperties = { blockSize: '100%', inlineSize: '100%', position: 'relative' };
const slotStyle: CSSProperties = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
  width: 'auto',
};
const hiddenSlotStyle: CSSProperties = { ...slotStyle, display: 'none' };

const styles = createStaticStyles(({ css }) => ({
  pane: css`
    overflow: hidden;
    min-width: 0;
  `,
}));

const TabHost = ({ createRouter = createTabRouter }: TabHostProps) => {
  // Deferred so a tab swap (e.g. a scope switch) is time-sliced: activating a cold tab
  // mounts its whole router tree, and when the page suspends on a lazy chunk the
  // outgoing pane stays on screen instead of flashing a fallback.
  const tabs = useDeferredValue(useElectronStore((s) => s.tabs));
  const activeTabId = useDeferredValue(useElectronStore((s) => s.activeTabId));
  const liveTabCap = useLiveTabRouterCap((s) => s.cap);

  const visibleTabIds = useMemo(() => (activeTabId ? [activeTabId] : []), [activeTabId]);

  const existingTabIds = useMemo(() => tabs.map((tab) => tab.id), [tabs]);
  const requestedRouters = useMemo(
    () =>
      visibleTabIds.flatMap((id) => {
        const tab = tabs.find((item) => item.id === id);
        return tab ? [getOrCreateTabRouter(id, tab.url, createRouter)] : [];
      }),
    [createRouter, tabs, visibleTabIds],
  );
  const displayedTabIds = useDisplayedTabIds({
    canHold: true,
    existingTabIds,
    requestedRouters,
    requestedTabIds: visibleTabIds,
  });

  const liveIds = useMemo(() => {
    const retainedTabIds = [...visibleTabIds, ...displayedTabIds];
    return resolveLiveTabIds(
      // Persisted tabs are cold until first shown; only retain already-created routers.
      tabs.filter((tab) => retainedTabIds.includes(tab.id) || getTabRouter(tab.id)),
      activeTabId,
      liveTabCap,
      retainedTabIds,
    );
  }, [tabs, activeTabId, liveTabCap, visibleTabIds, displayedTabIds]);

  const displayedActiveTabId =
    activeTabId && displayedTabIds.includes(activeTabId)
      ? activeTabId
      : (displayedTabIds[0] ?? null);

  useLayoutEffect(() => {
    useDisplayedTabStore.setState({ tabId: displayedActiveTabId });
  }, [displayedActiveTabId]);

  useEffect(() => {
    flushHiddenTabRestores(displayedTabIds);
  }, [displayedTabIds]);

  useEffect(() => {
    const liveSet = new Set(liveIds);
    const { snapshotTabLocation } = useElectronStore.getState();
    for (const id of getTabRouterIds()) {
      if (liveSet.has(id)) continue;
      const location = getTabRouter(id)?.state.location;
      if (location)
        snapshotTabLocation(id, `${location.pathname}${location.search}${location.hash}`);
    }
    syncTabRouters(liveIds);
  }, [liveIds]);

  const liveSet = new Set(liveIds);
  const visibleSet = new Set(displayedTabIds);
  // A held tab must not pre-mount: a hidden RouterProvider has no subscription,
  // so it would reveal its pre-load (empty) state once the router initializes.
  const heldSet = new Set(visibleTabIds.filter((id) => !visibleSet.has(id)));

  return (
    <div style={rootStyle}>
      {tabs
        .filter((tab) => liveSet.has(tab.id) && !heldSet.has(tab.id))
        .map((tab) => {
          const isVisible = visibleSet.has(tab.id);

          return (
            <Activity key={tab.id} mode={isVisible ? 'visible' : 'hidden'} name={`Tab:${tab.id}`}>
              {/* Activity preserves state but doesn't visually hide the DOM in this React
                  version, so force-hide the inactive slot (mirrors home/_layout). */}
              <div className={styles.pane} style={isVisible ? slotStyle : hiddenSlotStyle}>
                <TabIdContext value={tab.id}>
                  {/* react-router forbids a data <RouterProvider> inside another Router
                      (useInRouterContext invariant). Reset LocationContext so each per-tab
                      router mounts as a root; nothing renders between the reset and the
                      provider, so no consumer can observe the null gap. */}
                  <UNSAFE_LocationContext value={null as never}>
                    <RouterProvider router={getOrCreateTabRouter(tab.id, tab.url, createRouter)} />
                  </UNSAFE_LocationContext>
                </TabIdContext>
              </div>
            </Activity>
          );
        })}
    </div>
  );
};

export default TabHost;
