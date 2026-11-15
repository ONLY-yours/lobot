import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ScopeTitle from './ScopeTitle';

const mocks = vi.hoisted(() => ({
  available: true,
  workspace: null as { avatar: string | null; id: string; name: string } | null,
}));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/business/client/workspace/store', () => ({
  useWorkspaceStore: (selector: (s: { isWorkspaceAvailable: boolean }) => unknown) =>
    selector({ isWorkspaceAvailable: mocks.available }),
}));
vi.mock('@/business/client/hooks/useActiveWorkspace', () => ({
  useActiveWorkspace: () => mocks.workspace,
}));
vi.mock('@/components/Avatar', () => ({ default: () => <span data-testid={'user-avatar'} /> }));
vi.mock('@/components/WorkspaceAvatar', () => ({
  default: ({ name }: { name: string }) => <span data-testid={'workspace-avatar'}>{name}</span>,
}));
vi.mock('@/store/user', () => ({ useUserStore: () => '' }));

describe('ScopeTitle', () => {
  beforeEach(() => {
    mocks.available = true;
    mocks.workspace = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('names the active workspace with its avatar', () => {
    mocks.workspace = { avatar: null, id: 'ws-1', name: 'LobeHub' };

    render(<ScopeTitle />);

    expect(screen.getByTestId('workspace-avatar')).toBeInTheDocument();
    expect(screen.getAllByText('LobeHub')).toHaveLength(2);
  });

  it('labels the personal space with the user avatar', () => {
    render(<ScopeTitle />);

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
    expect(screen.getByText('workspaceRail.personal')).toBeInTheDocument();
  });

  it('renders nothing where the server has no workspaces (self-hosted)', () => {
    mocks.available = false;

    const { container } = render(<ScopeTitle />);

    expect(container).toBeEmptyDOMElement();
  });
});
