// Same load order as the desktop boot (see desktopRouter.bootInitOrder.test.ts):
// the navigation facade before the router config, or the config TDZ-crashes.
import '@/components/Skeleton/RouteSegment';
import '@/utils/NavigatorRegistrar.desktop';

import { createMemoryRouter, matchRoutes, type RouteObject } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useWorkspaceStore } from '@/business/client/workspace/store';
import { getOrCreateTabRouter, resetTabRouterManager } from '@/features/Electron/TabHost';
import { electronSystemService } from '@/services/electron/system';
import { createMainAreaChildren, desktopRoutes } from '@/spa/router/desktopRouter.config.desktop';
import { useElectronStore } from '@/store/electron';

import { navigateTab } from './activeTabNavigate';
import { isLobotPath, LOBOT_ROOT_SEGMENTS, webAppUrl } from './webApp';

const rootChildren = (routes: RouteObject[]): string[] =>
  routes.flatMap((route) =>
    route.path === '/' || route.path === undefined
      ? rootChildren(route.children ?? [])
      : [route.path.replace(/^\//, '').split('/')[0]],
  );

describe('LOBOT_ROOT_SEGMENTS', () => {
  // Pages live in each tab's router (the main area); the window router adds the onboarding shells.
  const tabRoutes: RouteObject[] = [{ children: createMainAreaChildren(), path: '/' }];

  it('lists exactly the root routes the desktop route tables serve', () => {
    const roots = new Set(
      [...rootChildren(tabRoutes), ...rootChildren(desktopRoutes)].filter(
        (path) => path && path !== '*',
      ),
    );

    expect([...roots].sort()).toEqual([...LOBOT_ROOT_SEGMENTS].sort());
  });

  it('resolves every listed root to a real page rather than the catch-all', () => {
    for (const segment of LOBOT_ROOT_SEGMENTS) {
      const matched =
        matchRoutes(tabRoutes, `/${segment}`) ?? matchRoutes(desktopRoutes, `/${segment}`);
      expect(matched?.at(-1)?.route.path, segment).not.toBe('*');
    }
  });
});

describe('isLobotPath', () => {
  it("keeps Lobot's own pages in the app", () => {
    for (const path of [
      '/',
      '/?x=1',
      '/channels/chn_1',
      '/agents/agt_1',
      '/settings/devices',
      '/acme/channels/chn_1',
    ]) {
      expect(isLobotPath(path), path).toBe(true);
    }
  });

  it('sends LobeHub-only pages to the web app', () => {
    for (const path of [
      '/agent/agt_1/profile',
      '/group/grp_1',
      '/memory',
      '/community/agent',
      '/acme/agent/agt_1',
    ]) {
      expect(isLobotPath(path), path).toBe(false);
    }
  });
});

describe('webAppUrl', () => {
  beforeEach(() => {
    useElectronStore.setState({ dataSyncConfig: { active: true, storageMode: 'cloud' } });
    useWorkspaceStore.setState({ activeWorkspaceId: null, workspaces: [] });
  });

  it('opens LobeHub Cloud in the personal space', () => {
    expect(webAppUrl('/agent/agt_1/profile')).toBe('https://app.lobehub.com/agent/agt_1/profile');
  });

  // Lobot keeps the workspace in the store, so the slug has to come from there.
  it('carries the workspace the server rail has selected', () => {
    useWorkspaceStore.setState({
      activeWorkspaceId: 'ws_1',
      workspaces: [{ id: 'ws_1', name: 'Acme', slug: 'acme' }] as never,
    });

    expect(webAppUrl('/agent/agt_1/profile')).toBe(
      'https://app.lobehub.com/acme/agent/agt_1/profile',
    );
  });

  it('uses the self-hosted server the desktop signed in to', () => {
    useElectronStore.setState({
      dataSyncConfig: {
        active: true,
        remoteServerUrl: 'https://lobe.example.com/',
        storageMode: 'selfHost',
      },
    });

    expect(webAppUrl('/group/grp_1')).toBe('https://lobe.example.com/group/grp_1');
  });
});

// Regression: the Agent profile panel's "view profile" navigated the tab to
// `/agent/:id/profile`, a route Lobot does not have, and the page errored.
describe('navigateTab', () => {
  const setup = () => {
    const router = getOrCreateTabRouter('t1', '/', (url) =>
      createMemoryRouter([{ element: null, path: '*' }], { initialEntries: [url] }),
    );
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(undefined);
    const openExternal = vi
      .spyOn(electronSystemService, 'openExternalLink')
      .mockResolvedValue(undefined);
    return { navigate, openExternal };
  };

  beforeEach(() => {
    useElectronStore.setState({ dataSyncConfig: { active: true, storageMode: 'cloud' } });
    useWorkspaceStore.setState({ activeWorkspaceId: null, workspaces: [] });
  });

  afterEach(() => {
    resetTabRouterManager();
    vi.restoreAllMocks();
  });

  it('opens a LobeHub-only page in the browser and leaves the tab where it is', () => {
    const { navigate, openExternal } = setup();

    navigateTab('t1', '/agent/agt_1/profile');

    expect(openExternal).toHaveBeenCalledWith('https://app.lobehub.com/agent/agt_1/profile');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps navigating in place for Lobot pages', () => {
    const { navigate, openExternal } = setup();

    navigateTab('t1', { pathname: '/channels/chn_1', search: '?x=1' });

    expect(navigate).toHaveBeenCalledWith(
      { pathname: '/channels/chn_1', search: '?x=1' },
      undefined,
    );
    expect(openExternal).not.toHaveBeenCalled();
  });
});
