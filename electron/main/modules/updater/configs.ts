import type { UpdateChannel } from '@lobechat/electron-client-ipc';

import { isDev } from '@/const/env';
import { getDesktopEnv } from '@/env';

// Build-time default channel, can be overridden at runtime via store
const rawChannel = getDesktopEnv().UPDATE_CHANNEL || 'stable';
export const coerceStoredUpdateChannel = (channel?: string | null): UpdateChannel =>
  channel === 'canary' ? 'canary' : 'stable';

/** Raw build channel for display (stable, canary, beta, or legacy nightly). */
export const BUILD_CHANNEL: string = rawChannel;
export const UPDATE_CHANNEL: UpdateChannel =
  rawChannel === 'canary' || rawChannel === 'beta' ? 'canary' : 'stable';

/**
 * Reduce a configured update server to its base URL: tolerate a missing scheme
 * (`releases.example.com` → `https://releases.example.com`), a legacy channel
 * suffix and a trailing slash. Empty input stays `undefined`.
 */
export const normalizeUpdateServerUrl = (url?: string | null): string | undefined => {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;

  const withScheme = /^[a-z][\d+.a-z-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withScheme.replace(/\/+$/, '').replace(/\/(stable|nightly|canary|beta)$/, '');
};

// S3 base URL for all channels
// e.g., https://releases.lobehub.com
// Each channel resolves to {base}/{channel}/
export const UPDATE_SERVER_URL = normalizeUpdateServerUrl(getDesktopEnv().UPDATE_SERVER_URL);

export const updaterConfig = {
  app: {
    autoCheckUpdate: true,
    autoDownloadUpdate: true,
    checkUpdateInterval: 60 * 60 * 1000, // 1 hour
  },
  enableAppUpdate: !isDev,
};

export const getSparkleFeedUrl = (baseUrl: string, channel: UpdateChannel) =>
  `${baseUrl.replace(/\/(stable|nightly|canary|beta)\/?$/, '').replace(/\/$/, '')}/${channel}/appcast-${process.arch}.xml`;
