import log from 'electron-log';
import { autoUpdater } from 'electron-updater';

import { isDev } from '@/const/env';
import { getDesktopEnv } from '@/env';
import type { LogLevel } from '@/utils/structuredLog';
import { writeStructuredLog } from '@/utils/structuredLog';

import { UPDATE_SERVER_URL } from './configs';
import type { UpdateEngine } from './engine';

autoUpdater.autoInstallOnAppQuit = false;

/**
 * electron-updater's own lines keep going to `main.log` (the update-test docs
 * grep it) and also reach `main.jsonl` with the rest of the main process.
 */
const toUpdaterLogger = (level: LogLevel) => (message?: unknown) => {
  log[level](message);
  writeStructuredLog({ level, message, ns: 'electron-updater', process: 'main' });
};
const updaterLogger = {
  debug: toUpdaterLogger('debug'),
  error: toUpdaterLogger('error'),
  info: toUpdaterLogger('info'),
  warn: toUpdaterLogger('warn'),
};

export const electronUpdaterEngine: UpdateEngine = {
  checkForUpdates: () => autoUpdater.checkForUpdates(),
  configure: (channel) => {
    log.transports.file.level = 'info';
    autoUpdater.logger = updaterLogger;
    autoUpdater.autoDownload = false;
    autoUpdater.forceDevUpdateConfig = isDev || getDesktopEnv().FORCE_DEV_UPDATE_CONFIG;
    autoUpdater.allowPrerelease = channel !== 'stable';
    if (UPDATE_SERVER_URL && !autoUpdater.forceDevUpdateConfig) {
      // The release workflow publishes `{channel}*.yml` next to `latest*.yml`.
      autoUpdater.channel = channel;
      autoUpdater.setFeedURL({ provider: 'generic', url: `${UPDATE_SERVER_URL}/${channel}` });
    } else if (!autoUpdater.forceDevUpdateConfig && channel !== 'stable') {
      // Without a server, keep the packaged app-update.yml: electron-builder
      // points it at the repository this build was released from. Its GitHub
      // releases only carry `latest*.yml`, so stable must not rename the file.
      autoUpdater.channel = channel;
    }
    // The channel setter mutates this flag. Windows/Linux retain rollback support.
    autoUpdater.allowDowngrade = true;
  },
  downloadUpdate: () => autoUpdater.downloadUpdate(),
  installOnQuit: () => {
    autoUpdater.autoInstallOnAppQuit = true;
  },
  isActive: () => autoUpdater.isUpdaterActive(),
  kind: 'electron-updater',
  on: (event, listener) => {
    autoUpdater.on(event, listener as (...args: any[]) => void);
  },
  quitAndInstall: () => autoUpdater.quitAndInstall(true, true),
};
