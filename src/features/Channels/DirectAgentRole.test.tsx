/**
 * @vitest-environment happy-dom
 */
import type { ChannelReplyJob } from '@lobechat/types';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DirectAgentRole } from './DirectAgentRole';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/store/agent', () => ({
  useAgentStore: (selector: (s: unknown) => unknown) =>
    selector({ useHydrateAgentConfig: () => undefined }),
}));
vi.mock('@/store/agent/selectors', () => ({
  agentSelectors: { getAgentMetaById: () => () => ({ description: 'Coordinator', title: 'Nasa' }) },
}));
vi.mock('@lobechat/types', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  agentSecondaryDisplayName: () => 'Coordinator',
}));

const running = {
  blockedCode: null,
  id: 'job_1',
  memberId: 'mem_1',
  publicationRevoked: false,
  status: 'running',
  threadId: 'thr_1',
  writerHeld: true,
} as ChannelReplyJob;

describe('DirectAgentRole', () => {
  it('shows the role while the Agent is idle', () => {
    render(<DirectAgentRole agentId="agt_1" />);

    expect(screen.getByText('Coordinator')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('says the Agent is working in place of its role', () => {
    render(<DirectAgentRole agentId="agt_1" job={running} />);

    expect(screen.getByRole('status').textContent).toContain('status.working');
    expect(screen.queryByText('Coordinator')).toBeNull();
  });
});
