import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { openCreateChannel, openInviteMembers } from '.';

const mocks = vi.hoisted(() => ({
  create: vi.fn(async () => 'chn_new'),
  createModal: vi.fn(),
  optionsProjectIds: [] as (string | undefined)[],
}));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@lobehub/ui', () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type={'button'} onClick={onClick}>
      {children}
    </button>
  ),
  createModal: mocks.createModal,
  Flexbox: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Icon: () => null,
  Input: () => null,
  Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  useModalContext: () => ({ close: vi.fn(), setCanDismissByClickOutside: vi.fn() }),
}));
vi.mock('@/business/client/hooks/useActiveWorkspaceId', () => ({
  useActiveWorkspaceId: () => null,
}));
vi.mock('@/components/AsyncError', () => ({ default: () => null }));
vi.mock('@/store/channel', () => ({ channelActions: { create: mocks.create } }));
vi.mock('./MemberSelection', () => ({ MemberSelection: () => null }));
vi.mock('./PeopleOptions', () => ({ usePersonName: () => () => '' }));
vi.mock('./useChannelAgentOptions', () => ({
  useChannelAgentOptions: (projectId?: string) => {
    mocks.optionsProjectIds.push(projectId);
    return { agents: [] };
  },
}));
vi.mock('./ScopeField', () => ({
  ScopeField: ({
    onChange,
    value,
  }: {
    onChange: (id: string | null) => void;
    value: string | null;
  }) => (
    <div data-testid={'scope'} data-value={value ?? 'general'}>
      <button type={'button'} onClick={() => onChange('prj_2')}>
        pick project
      </button>
      <button type={'button'} onClick={() => onChange(null)}>
        pick general
      </button>
    </div>
  ),
}));

const renderDialog = (open: () => void) => {
  open();
  render(mocks.createModal.mock.calls.at(-1)![0].content);
};

describe('CreateChannel scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.optionsProjectIds = [];
  });

  it('creates a general Channel from the "+" menu by default', async () => {
    renderDialog(() => openCreateChannel());
    expect(screen.getByTestId('scope')).toHaveAttribute('data-value', 'general');

    fireEvent.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ projectId: undefined });
  });

  it("makes it a project's Channel once a project is picked", async () => {
    renderDialog(() => openCreateChannel());
    fireEvent.click(screen.getByRole('button', { name: 'pick project' }));

    // The picker then offers that project's Agents first.
    expect(mocks.optionsProjectIds.at(-1)).toBe('prj_2');
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ projectId: 'prj_2' });
  });

  it("starts as the project's own from a project sidebar, and can turn general", async () => {
    renderDialog(() => openCreateChannel(undefined, 'prj_1'));
    expect(screen.getByTestId('scope')).toHaveAttribute('data-value', 'prj_1');

    fireEvent.click(screen.getByRole('button', { name: 'pick general' }));
    fireEvent.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ projectId: undefined });
  });

  it('asks nothing about scope when inviting into an existing Channel', () => {
    renderDialog(() =>
      openInviteMembers({ agentIds: [], id: 'chn_1', workspaceId: null } as never),
    );
    expect(screen.queryByTestId('scope')).not.toBeInTheDocument();
  });
});
