import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import WorkspaceRail from './index';

const mocks = vi.hoisted(() => ({
  activeId: null as string | null,
  available: true,
  openCreate: vi.fn(),
  navigate: vi.fn(),
  switchToPersonal: vi.fn(async () => {}),
  switchWorkspace: vi.fn(async (_id: string) => {}),
  workspaces: [] as { avatar: string | null; id: string; name: string; slug: string }[],
}));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('./style', () => ({
  RAIL_AVATAR_SIZE: 32,
  RAIL_TILE_RADIUS: 10,
  styles: { add: {}, divider: {}, item: {}, pill: {}, pillActive: {}, rail: {} },
}));
vi.mock('./CreateWorkspace', () => ({ useOpenCreateWorkspace: () => mocks.openCreate }));
vi.mock('@/business/client/workspace/store', () => ({
  useWorkspaceStore: (selector: (s: { isWorkspaceAvailable: boolean }) => unknown) =>
    selector({ isWorkspaceAvailable: mocks.available }),
}));
vi.mock('@/business/client/hooks/useWorkspaces', () => ({ useWorkspaces: () => mocks.workspaces }));
vi.mock('@/business/client/hooks/useActiveWorkspaceId', () => ({
  useActiveWorkspaceId: () => mocks.activeId,
}));
vi.mock('@/business/client/hooks/useSwitchWorkspace', () => ({
  useSwitchWorkspace: () => ({
    switchToPersonal: mocks.switchToPersonal,
    switchWorkspace: mocks.switchWorkspace,
  }),
}));
vi.mock('@/features/Workspace/useWorkspaceAwareNavigate', () => ({
  useWorkspaceAwareNavigate: () => mocks.navigate,
}));
vi.mock('@/components/Avatar', () => ({ default: () => <span /> }));
vi.mock('@/components/WorkspaceAvatar', () => ({ default: () => <span /> }));
vi.mock('@/store/user', () => ({ useUserStore: () => '' }));

describe('WorkspaceRail', () => {
  beforeEach(() => {
    mocks.activeId = null;
    mocks.available = true;
    mocks.workspaces = [
      { avatar: null, id: 'ws-1', name: 'LobeHub', slug: 'lobehub' },
      { avatar: null, id: 'ws-2', name: 'Acme', slug: 'acme' },
    ];
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders nothing where the server has no workspaces (self-hosted)', () => {
    mocks.available = false;
    const { container } = render(<WorkspaceRail />);
    expect(container).toBeEmptyDOMElement();
  });

  // With no workspace yet the rail still shows, so one can be created from it.
  it('offers creating a workspace even before the user has one', () => {
    mocks.workspaces = [];
    render(<WorkspaceRail />);

    fireEvent.click(screen.getByRole('button', { name: 'workspaceRail.create' }));
    expect(mocks.openCreate).toHaveBeenCalled();
  });

  it('lists the personal space first, then each workspace, marking the active one', () => {
    mocks.activeId = 'ws-2';
    render(<WorkspaceRail />);

    const items = screen.getAllByRole('button');
    expect(items.map((el) => el.getAttribute('aria-label'))).toEqual([
      'workspaceRail.personal',
      'LobeHub',
      'Acme',
      'workspaceRail.create',
    ]);
    expect(screen.getByRole('button', { name: 'Acme' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'LobeHub' })).not.toHaveAttribute('aria-current');
  });

  it('switches to a workspace and lands on its home', async () => {
    render(<WorkspaceRail />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Acme' }));
    });

    expect(mocks.switchWorkspace).toHaveBeenCalledWith('ws-2');
    expect(mocks.navigate).toHaveBeenCalledWith('/', { escape: true });
  });

  it('switches back to the personal space', async () => {
    mocks.activeId = 'ws-1';
    render(<WorkspaceRail />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'workspaceRail.personal' }));
    });

    expect(mocks.switchToPersonal).toHaveBeenCalled();
    expect(mocks.navigate).toHaveBeenCalledWith('/', { escape: true });
  });

  it('does nothing when the active scope is clicked again', async () => {
    mocks.activeId = 'ws-1';
    render(<WorkspaceRail />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'LobeHub' }));
    });

    expect(mocks.switchWorkspace).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
