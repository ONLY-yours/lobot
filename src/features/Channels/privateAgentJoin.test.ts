import { confirmModal } from '@lobehub/ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { agentService } from '@/services/agent';
import { useHomeStore } from '@/store/home';

import {
  confirmPublishPrivateAgents,
  ownPrivateAgentIds,
  PrivateAgentDeclinedError,
} from './privateAgentJoin';

vi.mock('@lobehub/ui', () => ({ confirmModal: vi.fn(), toast: { error: vi.fn() } }));
vi.mock('@/services/agent', () => ({
  agentService: { publishAgentToWorkspace: vi.fn() },
}));

type ConfirmConfig = Parameters<typeof confirmModal>[0];
const lastConfig = () => vi.mocked(confirmModal).mock.calls.at(-1)![0] as ConfirmConfig;

const refreshAgentList = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useHomeStore.setState({
    privateAgentGroups: [{ items: [{ id: 'grouped' }] }],
    privatePinnedAgents: [{ id: 'pinned' }],
    privateUngroupedAgents: [{ id: 'mine' }],
    refreshAgentList,
  } as any);
});

describe('ownPrivateAgentIds', () => {
  it('keeps only the agents in the user’s private bucket', () => {
    expect(ownPrivateAgentIds(['public', 'mine', 'grouped', 'pinned'])).toEqual([
      'mine',
      'grouped',
      'pinned',
    ]);
  });
});

describe('confirmPublishPrivateAgents', () => {
  it('asks nothing when no private Agent joins', async () => {
    await confirmPublishPrivateAgents([]);
    expect(confirmModal).not.toHaveBeenCalled();
  });

  it('publishes every private Agent before resolving', async () => {
    const pending = confirmPublishPrivateAgents([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);
    await lastConfig().onOk!();
    await pending;
    expect(agentService.publishAgentToWorkspace).toHaveBeenNthCalledWith(1, 'a');
    expect(agentService.publishAgentToWorkspace).toHaveBeenNthCalledWith(2, 'b');
    expect(refreshAgentList).toHaveBeenCalled();
  });

  it('rejects without publishing when the owner declines', async () => {
    const pending = confirmPublishPrivateAgents([{ id: 'a', name: 'A' }]);
    lastConfig().onCancel!();
    await expect(pending).rejects.toBeInstanceOf(PrivateAgentDeclinedError);
    expect(agentService.publishAgentToWorkspace).not.toHaveBeenCalled();
  });

  it('rejects when publishing fails, still refreshing what did change', async () => {
    vi.mocked(agentService.publishAgentToWorkspace).mockRejectedValueOnce(new Error('nope'));
    const pending = confirmPublishPrivateAgents([{ id: 'a', name: 'A' }]);
    await lastConfig().onOk!();
    await expect(pending).rejects.toThrow('nope');
    expect(refreshAgentList).toHaveBeenCalled();
  });
});
