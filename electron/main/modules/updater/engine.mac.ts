import type { UpdateChannel } from '@lobechat/electron-client-ipc';
import { app } from 'electron';

import { createLogger } from '@/utils/logger';

import { getSparkleFeedUrl, UPDATE_SERVER_URL } from './configs';
import type { UpdateEngine } from './engine';
import { SparkleEngine } from './sparkleEngine';

const logger = createLogger('modules:updater:engine');

/**
 * Sparkle only ships when the build has both an appcast host and an EdDSA key
 * (see scripts/sparklePackaging.mjs). Any other macOS build updates through
 * electron-updater from the same `latest-mac.yml` feed as Windows and Linux.
 */
export const createUpdateEngine = async (channel: UpdateChannel): Promise<UpdateEngine> => {
  if (UPDATE_SERVER_URL) {
    try {
      return await SparkleEngine.create({
        appcastUrl: getSparkleFeedUrl(UPDATE_SERVER_URL, channel),
        currentVersion: app.getVersion(),
      });
    } catch (error) {
      logger.warn('Sparkle unavailable, falling back to electron-updater:', error);
    }
  }

  return (await import('./electronUpdaterEngine')).electronUpdaterEngine;
};
