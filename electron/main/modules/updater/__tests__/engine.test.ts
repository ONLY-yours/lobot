import { autoUpdater } from 'electron-updater';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as Configs from '../configs';

const { mockConfig, mockLoadSparkleBridge } = vi.hoisted(() => ({
  mockConfig: { UPDATE_SERVER_URL: undefined as string | undefined },
  mockLoadSparkleBridge: vi.fn(),
}));

vi.mock('electron-sparkle-updater', () => ({ loadSparkleBridge: mockLoadSparkleBridge }));

vi.mock('electron', () => ({
  app: { getVersion: () => '0.0.1', isPackaged: true, on: vi.fn() },
  net: { fetch: vi.fn() },
}));

vi.mock('electron-log', () => ({
  default: { info: vi.fn(), transports: { file: { level: 'info' } } },
}));

vi.mock('electron-updater', () => {
  let channel: string | null = null;
  return {
    autoUpdater: {
      allowDowngrade: false,
      allowPrerelease: false,
      autoDownload: false,
      get channel() {
        return channel;
      },
      set channel(value: string | null) {
        channel = value;
      },
      forceDevUpdateConfig: false,
      logger: null,
      setFeedURL: vi.fn(),
    },
  };
});

vi.mock('@/utils/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

vi.mock('@/utils/structuredLog', () => ({ writeStructuredLog: vi.fn() }));

vi.mock('@/env', () => ({ getDesktopEnv: () => ({ FORCE_DEV_UPDATE_CONFIG: false }) }));

vi.mock('@/const/env', () => ({ isDev: false }));

vi.mock('../configs', async (importOriginal) => {
  const original = await importOriginal<typeof Configs>();
  return {
    ...original,
    get UPDATE_SERVER_URL() {
      return mockConfig.UPDATE_SERVER_URL;
    },
  };
});

describe('normalizeUpdateServerUrl', () => {
  it('adds https to a host without a scheme', async () => {
    const { normalizeUpdateServerUrl } = await import('../configs');
    expect(normalizeUpdateServerUrl('lobot-release.lobehub.com')).toBe(
      'https://lobot-release.lobehub.com',
    );
  });

  it('strips a legacy channel suffix and trailing slashes', async () => {
    const { normalizeUpdateServerUrl } = await import('../configs');
    expect(normalizeUpdateServerUrl('https://cdn.example.com/stable/')).toBe(
      'https://cdn.example.com',
    );
    expect(normalizeUpdateServerUrl('http://localhost:8787/')).toBe('http://localhost:8787');
  });

  it('treats empty input as unset', async () => {
    const { normalizeUpdateServerUrl } = await import('../configs');
    expect(normalizeUpdateServerUrl('  ')).toBeUndefined();
    expect(normalizeUpdateServerUrl(undefined)).toBeUndefined();
  });
});

describe('electronUpdaterEngine.configure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (autoUpdater as any).channel = null;
    mockConfig.UPDATE_SERVER_URL = undefined;
  });

  it('reads the update server feed for the channel', async () => {
    mockConfig.UPDATE_SERVER_URL = 'https://lobot-release.lobehub.com';
    const { electronUpdaterEngine } = await import('../electronUpdaterEngine');

    electronUpdaterEngine.configure('stable');

    expect(autoUpdater.setFeedURL).toHaveBeenCalledWith({
      provider: 'generic',
      url: 'https://lobot-release.lobehub.com/stable',
    });
    expect(autoUpdater.channel).toBe('stable');
  });

  it('keeps the packaged feed instead of pointing at another repository', async () => {
    const { electronUpdaterEngine } = await import('../electronUpdaterEngine');

    electronUpdaterEngine.configure('stable');

    expect(autoUpdater.setFeedURL).not.toHaveBeenCalled();
    // GitHub releases only carry latest*.yml; a stable channel would ask for stable*.yml.
    expect(autoUpdater.channel).toBeNull();
  });
});

describe('macOS createUpdateEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.UPDATE_SERVER_URL = undefined;
  });

  it('uses electron-updater when the build has no update server', async () => {
    const { createUpdateEngine } = await import('../engine.mac');

    const engine = await createUpdateEngine('stable');

    expect(engine.kind).toBe('electron-updater');
    expect(mockLoadSparkleBridge).not.toHaveBeenCalled();
  });

  it('uses electron-updater when Sparkle was not packaged', async () => {
    mockConfig.UPDATE_SERVER_URL = 'https://lobot-release.lobehub.com';
    mockLoadSparkleBridge.mockReturnValue(null);
    const { createUpdateEngine } = await import('../engine.mac');

    const engine = await createUpdateEngine('stable');

    expect(engine.kind).toBe('electron-updater');
  });
});
