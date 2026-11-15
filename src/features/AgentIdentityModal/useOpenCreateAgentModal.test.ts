import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useOpenCreateAgentModal } from './useOpenCreateAgentModal';

const mocks = vi.hoisted(() => ({
  canCreate: true,
  landOnCreatedAgent: vi.fn(),
  openCreateAgentIdentityModal: vi.fn(),
}));

vi.mock('./index', () => ({
  openCreateAgentIdentityModal: mocks.openCreateAgentIdentityModal,
}));

vi.mock('./useLandOnCreatedAgent', () => ({
  useLandOnCreatedAgent: () => mocks.landOnCreatedAgent,
}));

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({ allowed: mocks.canCreate }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.canCreate = true;
});

describe('useOpenCreateAgentModal', () => {
  it('opens the identity form and opens the new agent where it lands', () => {
    const { result } = renderHook(() => useOpenCreateAgentModal());

    result.current({ groupId: 'grp', visibility: 'private' });

    expect(mocks.openCreateAgentIdentityModal).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ groupId: 'grp', visibility: 'private' }),
    );
    const { onCreated } = mocks.openCreateAgentIdentityModal.mock.calls[0][0];
    onCreated('agent-new');
    expect(mocks.landOnCreatedAgent).toHaveBeenCalledWith('agent-new');
  });

  it('does nothing without create permission', () => {
    mocks.canCreate = false;
    const { result } = renderHook(() => useOpenCreateAgentModal());

    result.current();

    expect(mocks.openCreateAgentIdentityModal).not.toHaveBeenCalled();
  });
});
