import { EventEmitter } from 'node:events';
import { existsSync, statSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import * as os from 'node:os';
import path from 'node:path';

import type { CodexQuotaSnapshot, KimiCodeQuotaSnapshot } from '@lobechat/electron-client-ipc';
import {
  HETERO_EXEC_INHERIT_PROCESS_GROUP_ENV,
  lobeHubCliGuideBlock,
} from '@lobechat/heterogeneous-agents/protocol';
// `electron` is mocked below; this binding is the mock object so tests can
// flip `isPackaged` to exercise the packaged-build tracing gate.
import { app as electronAppMock } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HeterogeneousAgentCtr from '../HeterogeneousAgentCtr';

const FAKE_CLI_SCRIPT = path.normalize('/fake/cli/dist/index.js');

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof os>('node:os');
  return { ...actual, platform: vi.fn(() => 'linux') };
});

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, existsSync: vi.fn(() => true), statSync: vi.fn() };
});

// Working-directory checks go through `statSync`; treat every path as an
// existing directory unless a test marks one as missing.
const asDirectory = { isDirectory: () => true } as ReturnType<typeof statSync>;
const mockMissingDir = (missing: string) =>
  vi
    .mocked(statSync)
    .mockImplementation((candidate) => (candidate === missing ? undefined : asDirectory) as never);

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn(() => '/fake/appPath'),
    getPath: vi.fn((name: string) => `/fake/${name}`),
    getVersion: vi.fn(() => '1.0.0-test'),
    isPackaged: false,
    on: vi.fn(),
    quit: vi.fn(),
  },
  ipcMain: { handle: vi.fn() },
}));

vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    verbose: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock('@/modules/cliEmbedding', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  resolveCliScript: () => FAKE_CLI_SCRIPT,
}));

const { consumeCodexRateLimitResetCreditMock, fetchCodexQuotaMock, fetchKimiCodeQuotaMock } =
  vi.hoisted(() => ({
    consumeCodexRateLimitResetCreditMock: vi.fn(),
    fetchCodexQuotaMock: vi.fn(),
    fetchKimiCodeQuotaMock: vi.fn(),
  }));

vi.mock('@/modules/heterogeneousAgent/codexQuota', () => ({
  consumeCodexRateLimitResetCredit: consumeCodexRateLimitResetCreditMock,
  fetchCodexQuota: fetchCodexQuotaMock,
}));

vi.mock('@/modules/heterogeneousAgent/kimiCodeQuota', () => ({
  fetchKimiCodeQuota: fetchKimiCodeQuotaMock,
}));

// Captures every spawn() call so tests can assert on argv / options.
const spawnCalls: Array<{ args: string[]; command: string; options: any }> = [];
let nextFakeProc: any = null;
const { execFileMock } = vi.hoisted(() => ({ execFileMock: vi.fn() }));
vi.mock('node:child_process', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  return {
    ...actual,
    execFile: execFileMock,
    spawn: (command: string, args: string[], options: any) => {
      spawnCalls.push({ args, command, options });
      return nextFakeProc;
    },
  };
});

/** `codex --version` succeeds, so quota detection resolves the requested binary. */
const mockCodexVersion = () =>
  execFileMock.mockImplementation(
    (
      _file: string,
      _args: string[],
      optionsOrCallback: unknown,
      callback?: (error: Error | null, result: { stderr: string; stdout: string }) => void,
    ) => {
      const resolvedCallback =
        typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
      resolvedCallback?.(null, { stderr: '', stdout: 'codex-cli 0.99.0' });
    },
  );

const createApp = (appStoragePath: string, get: (key: string) => unknown = () => undefined) =>
  ({ appStoragePath, storeManager: { get: vi.fn(get) } }) as any;

describe('HeterogeneousAgentCtr', () => {
  let appStoragePath: string;

  beforeEach(async () => {
    appStoragePath = await mkdtemp(path.join(os.tmpdir(), 'lobehub-hetero-'));
    consumeCodexRateLimitResetCreditMock.mockReset();
    fetchCodexQuotaMock.mockReset();
    fetchKimiCodeQuotaMock.mockReset();
    execFileMock.mockReset();
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(statSync).mockReturnValue(asDirectory);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await rm(appStoragePath, { force: true, recursive: true });
  });

  describe('getCodexQuota', () => {
    beforeEach(() => mockCodexVersion());

    it('forwards desktop proxy env to the Codex quota RPC', async () => {
      fetchCodexQuotaMock.mockResolvedValue({
        error: null,
        provider: 'codex',
        session: null,
        status: 'ok',
        updatedAt: 1,
        weekly: null,
      });
      const networkProxy = {
        enableProxy: true,
        proxyPort: '7890',
        proxyServer: '127.0.0.1',
        proxyType: 'http',
      };
      const app = createApp(appStoragePath, (key) =>
        key === 'networkProxy' ? networkProxy : undefined,
      );
      const ctr = new HeterogeneousAgentCtr(app);

      await ctr.getCodexQuota({
        command: '/custom/bin/codex',
        env: { CODEX_HOME: '/tmp/codex-home', PATH: '/custom/bin' },
      });

      expect(app.storeManager.get).toHaveBeenCalledWith('networkProxy');
      expect(fetchCodexQuotaMock).toHaveBeenCalledWith({
        command: '/custom/bin/codex',
        env: expect.objectContaining({
          CODEX_HOME: '/tmp/codex-home',
          HTTPS_PROXY: 'http://127.0.0.1:7890',
          HTTP_PROXY: 'http://127.0.0.1:7890',
          PATH: '/custom/bin',
        }),
      });
    });

    it('reuses automatic quota reads while explicit refresh bypasses the cache', async () => {
      fetchCodexQuotaMock.mockResolvedValue({
        error: null,
        provider: 'codex',
        session: { resetsAt: null, usedPercent: 8, windowMinutes: 300 },
        status: 'ok',
        updatedAt: Date.now(),
        weekly: null,
      });
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));
      const params = { command: '/custom/bin/codex', env: { CODEX_HOME: '/tmp/codex-home' } };

      await ctr.getCodexQuota(params);
      await ctr.getCodexQuota(params);
      expect(fetchCodexQuotaMock).toHaveBeenCalledTimes(1);

      await ctr.getCodexQuota({ ...params, force: true });
      expect(fetchCodexQuotaMock).toHaveBeenCalledTimes(2);
    });

    it('consumes a reset credit and replaces the cached quota with a fresh snapshot', async () => {
      const initialQuota = {
        error: null,
        provider: 'codex',
        rateLimitResetCredits: { availableCount: 2 },
        session: { resetsAt: null, usedPercent: 96, windowMinutes: 300 },
        status: 'ok',
        updatedAt: 1,
        weekly: null,
      };
      const refreshedQuota = {
        ...initialQuota,
        rateLimitResetCredits: { availableCount: 1 },
        session: { resetsAt: null, usedPercent: 0, windowMinutes: 300 },
        updatedAt: 2,
      };
      fetchCodexQuotaMock.mockResolvedValueOnce(initialQuota).mockResolvedValueOnce(refreshedQuota);
      consumeCodexRateLimitResetCreditMock.mockResolvedValue('reset');
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));
      const source = { command: '/custom/bin/codex', env: { CODEX_HOME: '/tmp/codex-home' } };

      await ctr.getCodexQuota(source);
      await expect(
        ctr.consumeCodexRateLimitResetCredit({
          ...source,
          creditId: 'credit-first',
          idempotencyKey: 'redeem-request-1',
        }),
      ).resolves.toEqual({ outcome: 'reset', quota: refreshedQuota });

      expect(consumeCodexRateLimitResetCreditMock).toHaveBeenCalledWith({
        command: '/custom/bin/codex',
        creditId: 'credit-first',
        env: { CODEX_HOME: '/tmp/codex-home' },
        idempotencyKey: 'redeem-request-1',
      });
      expect(fetchCodexQuotaMock).toHaveBeenCalledTimes(2);
    });

    it('bypasses an in-flight pre-reset quota read after consuming a credit', async () => {
      const refreshedAt = Date.now();
      const staleQuota = {
        error: null,
        provider: 'codex',
        rateLimitResetCredits: { availableCount: 2 },
        session: { resetsAt: null, usedPercent: 96, windowMinutes: 300 },
        status: 'ok',
        updatedAt: refreshedAt - 1,
        weekly: null,
      } satisfies CodexQuotaSnapshot;
      const refreshedQuota = {
        ...staleQuota,
        rateLimitResetCredits: { availableCount: 1 },
        session: { resetsAt: null, usedPercent: 0, windowMinutes: 300 },
        updatedAt: refreshedAt,
      } satisfies CodexQuotaSnapshot;
      let resolveStaleQuota: ((quota: CodexQuotaSnapshot) => void) | undefined;
      fetchCodexQuotaMock
        .mockImplementationOnce(
          () =>
            new Promise<CodexQuotaSnapshot>((resolve) => {
              resolveStaleQuota = resolve;
            }),
        )
        .mockResolvedValueOnce(refreshedQuota);
      consumeCodexRateLimitResetCreditMock.mockResolvedValue('reset');
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));
      const source = { command: '/custom/bin/codex', env: { CODEX_HOME: '/tmp/codex-home' } };

      const staleRequest = ctr.getCodexQuota(source);
      await vi.waitFor(() => expect(fetchCodexQuotaMock).toHaveBeenCalledTimes(1));

      await expect(
        ctr.consumeCodexRateLimitResetCredit({
          ...source,
          creditId: 'credit-first',
          idempotencyKey: 'redeem-request-2',
        }),
      ).resolves.toEqual({ outcome: 'reset', quota: refreshedQuota });

      resolveStaleQuota?.(staleQuota);
      await expect(staleRequest).resolves.toEqual(staleQuota);
      await expect(ctr.getCodexQuota(source)).resolves.toEqual(refreshedQuota);
      expect(fetchCodexQuotaMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('getKimiCodeQuota', () => {
    const quota = (updatedAt: number) =>
      ({
        error: null,
        extraUsage: null,
        monthly: null,
        monthlyCode: null,
        provider: 'kimi-code',
        session: { resetsAt: null, usedPercent: 8, windowMinutes: 300 },
        status: 'ok',
        updatedAt,
        weekly: null,
      }) satisfies KimiCodeQuotaSnapshot;

    it('passes env and kimiCodeHomePath through to the quota sampler', async () => {
      fetchKimiCodeQuotaMock.mockResolvedValue(quota(1));
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));
      const params = {
        env: { KIMI_CODE_HOME: '/tmp/kimi-code-home' },
        kimiCodeHomePath: '/tmp/kimi-code-home',
      };

      await expect(ctr.getKimiCodeQuota(params)).resolves.toEqual(quota(1));
      expect(fetchKimiCodeQuotaMock).toHaveBeenCalledWith(params);
    });

    it('reuses automatic quota reads while explicit refresh bypasses the cache', async () => {
      fetchKimiCodeQuotaMock.mockResolvedValue(quota(Date.now()));
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));
      const params = { env: { KIMI_CODE_HOME: '/tmp/kimi-code-home' } };

      await ctr.getKimiCodeQuota(params);
      await ctr.getKimiCodeQuota(params);
      expect(fetchKimiCodeQuotaMock).toHaveBeenCalledTimes(1);

      await ctr.getKimiCodeQuota({ ...params, force: true });
      expect(fetchKimiCodeQuotaMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('getClaudeCodeInheritedRoutingEnv', () => {
    it('reports only external-routing flags from the desktop env', async () => {
      vi.stubEnv('CLAUDE_CODE_USE_BEDROCK', '1');
      vi.stubEnv('ANTHROPIC_API_KEY', 'host-key');
      try {
        const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));
        const flags = await ctr.getClaudeCodeInheritedRoutingEnv();

        expect(flags).toEqual(expect.objectContaining({ CLAUDE_CODE_USE_BEDROCK: '1' }));
        expect(flags).not.toHaveProperty('ANTHROPIC_API_KEY');
      } finally {
        vi.unstubAllEnvs();
      }
    });
  });

  describe('spawnLhHeteroExec', () => {
    const params = {
      agentType: 'opencode',
      assistantMessageId: 'asst-gateway',
      jwt: 'device-jwt',
      operationId: 'op-gateway',
      prompt: 'inspect the repository',
      serverUrl: 'https://server.example.com',
      topicId: 'topic-gateway',
    };

    const createGatewayCliProc = () => {
      const proc = new EventEmitter() as any;
      const stdin = new EventEmitter() as any;
      stdin.end = vi.fn();
      stdin.write = vi.fn(() => true);
      proc.kill = vi.fn(() => true);
      proc.pid = 4321;
      proc.stdin = stdin;
      return proc;
    };

    beforeEach(() => {
      spawnCalls.length = 0;
      nextFakeProc = null;
    });

    it('uses the self-contained embedded CLI instead of a global lh from PATH', async () => {
      const proc = createGatewayCliProc();
      nextFakeProc = proc;
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));

      const ack = ctr.spawnLhHeteroExec(params);

      expect(spawnCalls).toHaveLength(1);
      const [spawnCall] = spawnCalls;
      expect(spawnCall.command).toBe(process.execPath);
      expect(spawnCall.args.slice(0, 7)).toEqual([
        FAKE_CLI_SCRIPT,
        'hetero',
        'exec',
        '--type',
        'opencode',
        '--operation-id',
        'op-gateway',
      ]);
      expect(spawnCall.options.cwd).toBe(process.cwd());
      expect(spawnCall.options.windowsHide).toBe(true);
      expect(spawnCall.options.env).toEqual(
        expect.objectContaining({
          ELECTRON_RUN_AS_NODE: '1',
          [HETERO_EXEC_INHERIT_PROCESS_GROUP_ENV]: '1',
          LOBEHUB_ASSISTANT_MESSAGE_ID: 'asst-gateway',
          LOBEHUB_JWT: 'device-jwt',
          LOBEHUB_SERVER: 'https://server.example.com',
        }),
      );
      expect(spawnCall.options.env).not.toHaveProperty('LOBEHUB_WORKSPACE_ID');
      expect(proc.stdin.write).not.toHaveBeenCalled();

      proc.emit('spawn');

      await expect(ack).resolves.toEqual({ status: 'accepted' });
      expect(proc.stdin.write).toHaveBeenCalledOnce();
      expect(proc.stdin.end).toHaveBeenCalledOnce();
    });

    it.each([undefined, 'agt_dispatched'])(
      'replaces launcher identity with dispatched agent %s',
      async (agentId) => {
        for (const key of [
          'AGENT',
          'TASK',
          'OPERATION',
          'TOPIC',
          'WORKSPACE',
          'ASSISTANT_MESSAGE',
        ]) {
          vi.stubEnv(`LOBEHUB_${key}_ID`, `launcher-${key}`);
        }
        try {
          const proc = createGatewayCliProc();
          nextFakeProc = proc;
          const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));

          const ack = ctr.spawnLhHeteroExec({ ...params, agentId, assistantMessageId: undefined });
          proc.emit('spawn');
          await expect(ack).resolves.toEqual({ status: 'accepted' });

          const env = spawnCalls[0].options.env;
          expect(env.LOBEHUB_AGENT_ID).toBe(agentId);
          expect(env.LOBEHUB_OPERATION_ID).toBe(params.operationId);
          expect(env.LOBEHUB_TOPIC_ID).toBe(params.topicId);
          for (const key of ['TASK', 'WORKSPACE', 'ASSISTANT_MESSAGE']) {
            expect(env).not.toHaveProperty(`LOBEHUB_${key}_ID`);
          }
        } finally {
          vi.unstubAllEnvs();
        }
      },
    );

    it('forwards the topic workspace as LOBEHUB_WORKSPACE_ID for ingest', async () => {
      const proc = createGatewayCliProc();
      nextFakeProc = proc;
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));

      const ack = ctr.spawnLhHeteroExec({ ...params, workspaceId: 'ws-lobehub' });
      proc.emit('spawn');
      await expect(ack).resolves.toEqual({ status: 'accepted' });

      expect(spawnCalls[0].options.env).toEqual(
        expect.objectContaining({ LOBEHUB_WORKSPACE_ID: 'ws-lobehub' }),
      );
    });

    it('encodes primary and resume fallback contexts for the embedded CLI', async () => {
      const proc = createGatewayCliProc();
      nextFakeProc = proc;
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));

      const ack = ctr.spawnLhHeteroExec({
        ...params,
        resumeFallbackSystemContext: 'workspace rules\n\nprevious conversation',
        resumeSessionId: 'session-1',
        systemContext: 'workspace rules',
      });
      proc.emit('spawn');

      await expect(ack).resolves.toEqual({ status: 'accepted' });
      expect(spawnCalls[0].args).toEqual(expect.arrayContaining(['--resume', 'session-1']));
      expect(proc.stdin.write).toHaveBeenCalledWith(
        JSON.stringify({
          content: [
            { text: 'workspace rules', type: 'text' },
            { text: 'inspect the repository', type: 'text' },
          ],
          resumeFallback: [
            { text: 'workspace rules\n\nprevious conversation', type: 'text' },
            // Native resume failed, so the retry opens a session that has never
            // seen the introduction the first turn delivered.
            lobeHubCliGuideBlock,
            { text: 'inspect the repository', type: 'text' },
          ],
        }),
      );
    });

    it('rejects the gateway request when the embedded CLI cannot spawn', async () => {
      const proc = createGatewayCliProc();
      nextFakeProc = proc;
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));

      const ack = ctr.spawnLhHeteroExec(params);
      proc.emit('error', new Error('spawn EACCES'));

      await expect(ack).resolves.toEqual({ reason: 'spawn EACCES', status: 'rejected' });
      expect(proc.stdin.write).not.toHaveBeenCalled();
    });

    it('starts the wrapper from home so its inner preflight can report a missing cwd', async () => {
      const missingCwd = '/missing/project';
      const proc = createGatewayCliProc();
      nextFakeProc = proc;
      mockMissingDir(missingCwd);
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));

      const ack = ctr.spawnLhHeteroExec({ ...params, cwd: missingCwd });

      const [spawnCall] = spawnCalls;
      const cwdArgIndex = spawnCall.args.indexOf('--cwd');
      expect(spawnCall.options.cwd).toBe(os.homedir());
      expect(spawnCall.args[cwdArgIndex + 1]).toBe(missingCwd);
      expect(spawnCall.args).not.toContain('--raw-dump');
      proc.emit('spawn');

      await expect(ack).resolves.toEqual({ status: 'accepted' });
      expect(proc.stdin.write).toHaveBeenCalledOnce();
    });

    it('rejects before spawn when the embedded CLI is missing', async () => {
      vi.mocked(existsSync).mockImplementation((candidate) => candidate !== FAKE_CLI_SCRIPT);
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));

      await expect(ctr.spawnLhHeteroExec(params)).resolves.toEqual({
        reason: `Embedded CLI not found at ${FAKE_CLI_SCRIPT}`,
        status: 'rejected',
      });
      expect(spawnCalls).toHaveLength(0);
    });

    it('rejects a synchronous stdin write failure without throwing from the event handler', async () => {
      const proc = createGatewayCliProc();
      proc.stdin.write.mockImplementationOnce(() => {
        throw new Error('write EPIPE');
      });
      nextFakeProc = proc;
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));

      const ack = ctr.spawnLhHeteroExec(params);
      expect(() => proc.emit('spawn')).not.toThrow();

      await expect(ack).resolves.toEqual({ reason: 'write EPIPE', status: 'rejected' });
    });

    it('handles a late stdin EPIPE after acceptance without an uncaught stream error', async () => {
      const proc = createGatewayCliProc();
      nextFakeProc = proc;
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));

      const ack = ctr.spawnLhHeteroExec(params);
      proc.emit('spawn');
      await expect(ack).resolves.toEqual({ status: 'accepted' });

      expect(() => proc.stdin.emit('error', new Error('write EPIPE'))).not.toThrow();
    });

    describe('raw-dump tracing in packaged builds', () => {
      let originalNodeEnv: string | undefined;

      beforeEach(() => {
        originalNodeEnv = process.env.NODE_ENV;
        // The gate short-circuits to `false` under NODE_ENV=test, so simulate a
        // real packaged production process.
        process.env.NODE_ENV = 'production';
        (electronAppMock as any).isPackaged = true;
      });

      afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        (electronAppMock as any).isPackaged = false;
      });

      it('dumps under <appStorage>/heteroAgent/tracing when the Help-menu toggle is on', async () => {
        const proc = createGatewayCliProc();
        nextFakeProc = proc;
        const ctr = new HeterogeneousAgentCtr(
          createApp(appStoragePath, (key) => (key === 'heteroTracingEnabled' ? true : undefined)),
        );

        const ack = ctr.spawnLhHeteroExec({ ...params, cwd: '/repo/project' });
        proc.emit('spawn');
        await expect(ack).resolves.toEqual({ status: 'accepted' });

        const { args } = spawnCalls[0];
        const dumpIndex = args.indexOf('--raw-dump');
        expect(dumpIndex).toBeGreaterThan(-1);
        expect(args[dumpIndex + 1]).toBe(path.join(appStoragePath, 'heteroAgent', 'tracing'));
      });

      it('passes no --raw-dump when the toggle is off', async () => {
        const proc = createGatewayCliProc();
        nextFakeProc = proc;
        const ctr = new HeterogeneousAgentCtr(
          createApp(appStoragePath, (key) => (key === 'heteroTracingEnabled' ? false : undefined)),
        );

        const ack = ctr.spawnLhHeteroExec({ ...params, cwd: '/repo/project' });
        proc.emit('spawn');
        await expect(ack).resolves.toEqual({ status: 'accepted' });

        expect(spawnCalls[0].args).not.toContain('--raw-dump');
      });
    });

    /**
     * @example A replacement waits until operation A's process group exits before operation B starts.
     */
    it('waits for the complete gateway CLI process group before confirming cancellation', async () => {
      // ROOT CAUSE:
      //
      // Device-dispatched Codex wrappers were not registered by operation id, so
      // server cancellation returned while the native thread still had an active
      // writer. A replacement resume then failed with `already has an active writer`.
      vi.useFakeTimers();
      let groupAlive = true;
      const killSpy = vi.spyOn(process, 'kill').mockImplementation((_pid, signal) => {
        if (signal === 'SIGKILL') groupAlive = false;
        if (signal === 0 && !groupAlive) {
          throw Object.assign(new Error('No such process'), { code: 'ESRCH' });
        }
        return true;
      });
      const proc = createGatewayCliProc();
      nextFakeProc = proc;
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));

      try {
        const ack = ctr.spawnLhHeteroExec(params);
        proc.emit('spawn');
        await ack;

        let cancellationSettled = false;
        const cancellation = ctr
          .cancelLhHeteroExec({ operationId: params.operationId })
          .then((result) => {
            cancellationSettled = true;
            return result;
          });
        await Promise.resolve();

        expect(killSpy).toHaveBeenCalledWith(-4321, 'SIGINT');
        expect(cancellationSettled).toBe(false);

        // The wrapper can exit while a native agent or tool descendant remains.
        proc.emit('exit', 130, 'SIGINT');
        await vi.advanceTimersByTimeAsync(1950);
        expect(cancellationSettled).toBe(false);

        await vi.advanceTimersByTimeAsync(100);
        expect(killSpy).toHaveBeenCalledWith(-4321, 'SIGKILL');
        await expect(cancellation).resolves.toEqual({
          exited: true,
          pid: 4321,
          signal: 'SIGINT',
        });
      } finally {
        killSpy.mockRestore();
      }
    });

    it('returns undefined when cancelling an operation it never spawned', async () => {
      const ctr = new HeterogeneousAgentCtr(createApp(appStoragePath));

      await expect(ctr.cancelLhHeteroExec({ operationId: 'unknown' })).resolves.toBeUndefined();
    });
  });
});
