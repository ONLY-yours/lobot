/**
 * @vitest-environment happy-dom
 */
import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SharedAgentOwnerCard, useSharedAgentOwner } from './SharedAgentOwner';

const { acceptRequest, channels, contacts, navigate, openPeer, sendRequest, useFetchShare } =
  vi.hoisted(() => ({
    acceptRequest: vi.fn(),
    channels: { list: [] as Array<Record<string, unknown>> },
    contacts: {
      listMap: {} as Record<string, unknown[] | undefined>,
      profileMap: {} as Record<string, unknown>,
      requestsMap: {} as Record<string, unknown[]>,
      shareMap: {} as Record<string, unknown[]>,
    },
    navigate: vi.fn(),
    openPeer: vi.fn(),
    sendRequest: vi.fn(),
    useFetchShare: vi.fn(),
  }));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/components/Avatar', () => ({ default: () => null }));
vi.mock('@/components/UserAvatar', () => ({ default: () => null }));
vi.mock('@/features/Workspace/useWorkspaceAwareNavigate', () => ({
  useWorkspaceAwareNavigate: () => navigate,
}));
vi.mock('@/store/channel', () => ({
  channelActions: { openPeer },
  channelSelectors: { list: (s: typeof channels) => s.list },
  useChannelStore: (selector: (s: typeof channels) => unknown) => selector(channels),
}));
vi.mock('@/store/contact', async (original) => ({
  ...(await original<object>()),
  contactActions: {
    acceptRequest,
    sendRequest,
    useFetchList: vi.fn(),
    useFetchProfile: vi.fn(),
    useFetchRequests: vi.fn(),
    useFetchShare,
  },
  useContactStore: (selector: (s: typeof contacts) => unknown) => selector(contacts),
}));

const owner = { avatar: null, fullName: 'tj', id: 'u_tj', username: 'tj' };
const agent = {
  agentId: 'agt_shared',
  avatar: null,
  backgroundColor: null,
  description: null,
  owner,
  shareId: 'share-1',
  slug: 'wannuo',
  title: '晚诺',
};

beforeEach(() => {
  vi.clearAllMocks();
  channels.list = [
    { agentId: 'agt_shared', id: 'chn_1', sharedAgent: true, sharedAgentHandle: 'wannuo' },
    { agentId: 'agt_mine', id: 'chn_2', sharedAgent: false },
  ];
  contacts.listMap = { all: [] };
  contacts.profileMap = {};
  contacts.requestsMap = { all: [] };
  contacts.shareMap = {};
});

describe('useSharedAgentOwner', () => {
  it('names nobody for one’s own Agent', () => {
    const { result } = renderHook(() => useSharedAgentOwner('chn_2', 'agt_mine'));

    expect(result.current).toBeUndefined();
    expect(useFetchShare).toHaveBeenCalledWith(undefined);
  });

  it('reads the owner from the contact entry without fetching the share', () => {
    contacts.listMap = { all: [{ agent, available: true, createdAt: new Date(), type: 'agent' }] };
    const { result } = renderHook(() => useSharedAgentOwner('chn_1', 'agt_shared'));

    expect(result.current).toEqual(owner);
    expect(useFetchShare).toHaveBeenCalledWith(undefined);
  });

  it('falls back to the share when the Agent is not in contacts', () => {
    contacts.shareMap = { wannuo: [{ agent, relation: 'none', type: 'agent' }] };
    const { result } = renderHook(() => useSharedAgentOwner('chn_1', 'agt_shared'));

    expect(result.current).toEqual(owner);
    expect(useFetchShare).toHaveBeenCalledWith('wannuo');
  });
});

describe('SharedAgentOwnerCard', () => {
  const renderCard = () => render(createElement(SharedAgentOwnerCard, { owner }));

  it('offers a contact request to an owner who is not a contact', async () => {
    contacts.profileMap = { u_tj: { relation: 'none', sharedAgents: [], user: owner } };
    sendRequest.mockResolvedValue({ status: 'pending' });
    renderCard();

    fireEvent.click(screen.getByText('contacts.person.request'));

    await waitFor(() => expect(sendRequest).toHaveBeenCalledWith('u_tj'));
  });

  it('shows a sent request as done', () => {
    contacts.profileMap = { u_tj: { relation: 'request_sent', sharedAgents: [], user: owner } };
    renderCard();

    expect(screen.getByText('contacts.person.requestSent').closest('button')).toBeDisabled();
  });

  it('accepts the owner’s own pending request', async () => {
    const request = { createdAt: new Date(), direction: 'incoming', id: 'req_1', user: owner };
    contacts.profileMap = { u_tj: { relation: 'request_received', sharedAgents: [], user: owner } };
    contacts.requestsMap = { all: [request] };
    renderCard();

    fireEvent.click(screen.getByText('contacts.person.accept'));

    await waitFor(() => expect(acceptRequest).toHaveBeenCalledWith(request));
  });

  it('messages an owner who is already a contact', async () => {
    contacts.profileMap = { u_tj: { relation: 'contact', sharedAgents: [], user: owner } };
    openPeer.mockResolvedValue('chn_peer');
    renderCard();

    fireEvent.click(screen.getByText('contacts.sendMessage'));

    await waitFor(() => expect(openPeer).toHaveBeenCalledWith('u_tj'));
    await waitFor(() => expect(navigate).toHaveBeenCalled());
  });
});
