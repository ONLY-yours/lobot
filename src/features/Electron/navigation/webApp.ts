import { OFFICIAL_URL } from '@lobechat/const';

import { getWorkspaceStoreState } from '@/business/client/workspace/store';
import { parseRootSegment, RESERVED_ROOT_SEGMENTS } from '@/features/Workspace/rootSegments';
import { buildWorkspaceAwarePath } from '@/features/Workspace/workspaceAwarePath';
import { electronSystemService } from '@/services/electron/system';
import { getElectronStoreState } from '@/store/electron';

/**
 * First path segments Lobot routes in-app. Everything else (`/agent/:id/profile`,
 * `/group/...`, `/memory`, `/community`, ...) exists only in the LobeHub web app,
 * which Lobot opens in the browser instead of an empty in-app page.
 * `webApp.test.ts` checks this set against the desktop route table.
 */
export const LOBOT_ROOT_SEGMENTS: ReadonlySet<string> = new Set([
  'agents',
  'channels',
  'desktop-onboarding',
  'onboarding',
  'settings',
]);

/** Whether an absolute in-app path is one of Lobot's own pages, workspace prefix or not. */
export const isLobotPath = (path: string): boolean => {
  let segment = parseRootSegment(path);
  // Any other first segment is a `/:workspaceSlug`; the page is the one after it.
  if (segment !== null && !RESERVED_ROOT_SEGMENTS.has(segment))
    segment = parseRootSegment(path.slice(segment.length + 1));
  return segment === null || LOBOT_ROOT_SEGMENTS.has(segment);
};

/**
 * The LobeHub web app address for an in-app path, in the workspace the server
 * rail has selected. Lobot keeps that workspace in the store, not the URL, so
 * the web app's `/:workspaceSlug` prefix is added here.
 */
export const webAppUrl = (path: string): string => {
  const { dataSyncConfig } = getElectronStoreState();
  const base =
    dataSyncConfig.storageMode === 'selfHost' && dataSyncConfig.remoteServerUrl
      ? dataSyncConfig.remoteServerUrl
      : OFFICIAL_URL;

  const { activeWorkspaceId, workspaces } = getWorkspaceStoreState();
  const slug = workspaces.find((workspace) => workspace.id === activeWorkspaceId)?.slug ?? null;

  return `${base.replace(/\/+$/, '')}${buildWorkspaceAwarePath(path, slug)}`;
};

export const openInWebApp = (path: string): void => {
  void electronSystemService.openExternalLink(webAppUrl(path));
};
