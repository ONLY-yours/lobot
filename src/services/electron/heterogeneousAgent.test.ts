import { describe, expect, it, vi } from 'vitest';

const mockHeterogeneousAgent = vi.hoisted(() => ({
  consumeCodexRateLimitResetCredit: vi.fn(),
  getClaudeCodeQuota: vi.fn(),
  getCodexQuota: vi.fn(),
  listModels: vi.fn(),
  resolveClaudeCodeAccount: vi.fn(),
}));

vi.mock('@/utils/electron/ipc', () => ({
  ensureElectronIpc: () => ({
    heterogeneousAgent: mockHeterogeneousAgent,
  }),
}));

describe('heterogeneousAgentService', () => {
  it('forwards model catalog params over IPC', async () => {
    const { heterogeneousAgentService } = await import('./heterogeneousAgent');
    const catalog = {
      models: [{ id: 'openai/gpt-5.6', modelId: 'gpt-5.6', providerId: 'openai' }],
      status: 'success',
      updatedAt: 1,
    };
    mockHeterogeneousAgent.listModels.mockResolvedValue(catalog);
    const params = {
      command: '/custom/opencode',
      cwd: '/repo',
      env: { OPENCODE_CONFIG_DIR: '/config' },
      type: 'opencode' as const,
    };

    await expect(heterogeneousAgentService.listModels(params)).resolves.toEqual(catalog);
    expect(mockHeterogeneousAgent.listModels).toHaveBeenCalledWith(params);
  });

  it('forwards getClaudeCodeQuota params over IPC and returns the snapshot', async () => {
    const { heterogeneousAgentService } = await import('./heterogeneousAgent');

    const snapshot = {
      error: null,
      provider: 'claude-code',
      scopedWeekly: null,
      session: { resetsAt: null, usedPercent: 8, windowMinutes: 300 },
      status: 'ok',
      updatedAt: 1,
      weekly: null,
    };
    mockHeterogeneousAgent.getClaudeCodeQuota.mockResolvedValue(snapshot);

    const params = { env: { CLAUDE_CONFIG_DIR: '/custom/claude' }, force: true };
    await expect(heterogeneousAgentService.getClaudeCodeQuota(params)).resolves.toEqual(snapshot);
    expect(mockHeterogeneousAgent.getClaudeCodeQuota).toHaveBeenCalledWith(params);
  });

  it('forwards getCodexQuota params over IPC and returns the snapshot', async () => {
    const { heterogeneousAgentService } = await import('./heterogeneousAgent');

    const snapshot = {
      error: null,
      provider: 'codex',
      session: null,
      status: 'ok',
      updatedAt: 1,
      weekly: null,
    };
    mockHeterogeneousAgent.getCodexQuota.mockResolvedValue(snapshot);

    const params = {
      command: '/usr/local/bin/codex',
      env: { CODEX_HOME: '/tmp/codex' },
      force: true,
    };
    await expect(heterogeneousAgentService.getCodexQuota(params)).resolves.toEqual(snapshot);
    expect(mockHeterogeneousAgent.getCodexQuota).toHaveBeenCalledWith(params);
  });

  it('forwards Codex reset-credit consumption over IPC', async () => {
    const { heterogeneousAgentService } = await import('./heterogeneousAgent');
    const result = {
      outcome: 'reset',
      quota: {
        error: null,
        provider: 'codex',
        rateLimitResetCredits: { availableCount: 0 },
        session: { resetsAt: null, usedPercent: 0, windowMinutes: 300 },
        status: 'ok',
        updatedAt: 2,
        weekly: null,
      },
    };
    mockHeterogeneousAgent.consumeCodexRateLimitResetCredit.mockResolvedValue(result);
    const params = {
      command: '/usr/local/bin/codex',
      creditId: 'credit-first',
      env: { CODEX_HOME: '/tmp/codex' },
      idempotencyKey: 'redeem-request-1',
    };

    await expect(
      heterogeneousAgentService.consumeCodexRateLimitResetCredit(params),
    ).resolves.toEqual(result);
    expect(mockHeterogeneousAgent.consumeCodexRateLimitResetCredit).toHaveBeenCalledWith(params);
  });

  it('wraps the provider account id for Claude Code account resolution', async () => {
    const { heterogeneousAgentService } = await import('./heterogeneousAgent');

    await heterogeneousAgentService.resolveClaudeCodeAccount('acct-1');
    expect(mockHeterogeneousAgent.resolveClaudeCodeAccount).toHaveBeenCalledWith({
      externalAccountId: 'acct-1',
    });
  });
});
