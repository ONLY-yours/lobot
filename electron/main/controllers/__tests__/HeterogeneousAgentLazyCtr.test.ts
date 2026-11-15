import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { App } from '@/core/App';

import HeterogeneousAgentCtr from '../HeterogeneousAgentCtr';

const lazyMocks = vi.hoisted(() => ({
  accountsLoaded: vi.fn(),
  createClaudeCodeAccountProfiles: vi.fn(() => ({
    list: vi.fn(async () => [{ id: 'default' }]),
    resolve: vi.fn(async (externalAccountId: string) => ({ externalAccountId })),
  })),
  fetchClaudeCodeQuota: vi.fn(async () => ({ provider: 'claude-code', updatedAt: Date.now() })),
  samplerLoaded: vi.fn(),
}));

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/fake/desktop'), isPackaged: false },
  ipcMain: { handle: vi.fn() },
}));

vi.mock('@lobechat/heterogeneous-agents/quota-sampler', async (importOriginal) => {
  lazyMocks.samplerLoaded();
  return {
    ...(await importOriginal<Record<string, unknown>>()),
    fetchClaudeCodeQuota: lazyMocks.fetchClaudeCodeQuota,
  };
});

vi.mock('@/modules/heterogeneousAgent/claudeCodeAccountsHost', () => {
  lazyMocks.accountsLoaded();
  return { createClaudeCodeAccountProfiles: lazyMocks.createClaudeCodeAccountProfiles };
});

const createApp = () =>
  ({ appStoragePath: '/tmp/lobehub-lazy', storeManager: { get: vi.fn() } }) as unknown as App;

describe('HeterogeneousAgentCtr lazy modules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the quota sampler on the first quota read and shares one cache afterwards', async () => {
    const controller = new HeterogeneousAgentCtr(createApp());
    expect(lazyMocks.samplerLoaded).not.toHaveBeenCalled();

    await controller.getClaudeCodeQuota();
    await controller.getClaudeCodeQuota();

    expect(lazyMocks.samplerLoaded).toHaveBeenCalledOnce();
    // The second read is served from the snapshot cache built with the sampler.
    expect(lazyMocks.fetchClaudeCodeQuota).toHaveBeenCalledOnce();
  });

  it('builds the Claude Code account profiles once, on first account access', async () => {
    const app = createApp();
    const controller = new HeterogeneousAgentCtr(app);
    expect(lazyMocks.accountsLoaded).not.toHaveBeenCalled();

    await expect(controller.listClaudeCodeAccounts()).resolves.toEqual([{ id: 'default' }]);
    await expect(
      controller.resolveClaudeCodeAccount({ externalAccountId: 'acct-1' }),
    ).resolves.toEqual({ externalAccountId: 'acct-1' });

    expect(lazyMocks.accountsLoaded).toHaveBeenCalledOnce();
    expect(lazyMocks.createClaudeCodeAccountProfiles).toHaveBeenCalledOnce();
    expect(lazyMocks.createClaudeCodeAccountProfiles).toHaveBeenCalledWith(
      app,
      expect.any(Function),
    );
  });
});
