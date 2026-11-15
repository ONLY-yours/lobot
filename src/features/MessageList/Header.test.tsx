import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Header from './Header';

const mocks = vi.hoisted(() => ({
  channelsEnabled: true,
  navigate: vi.fn(),
  openCreateGroupChannel: vi.fn(),
}));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@lobehub/ui', () => ({
  ActionIcon: () => null,
  DropdownMenu: ({ items }: { items: { key: string; label: string; onClick?: () => void }[] }) => (
    <ul>
      {items.map((item) => (
        <li key={item.key}>
          <button type={'button'} onClick={item.onClick}>
            {item.key}
          </button>
        </li>
      ))}
    </ul>
  ),
  Flexbox: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Icon: () => null,
  SearchBar: () => null,
  Text: () => null,
}));
vi.mock('@lobehub/ui/icons', () => ({ GroupBotSquareIcon: () => null }));
vi.mock('@/features/Channels/CreateChannel', () => ({
  openCreateGroupChannel: mocks.openCreateGroupChannel,
}));
vi.mock('@/features/Channels/useChannelsEnabled', () => ({
  useChannelsEnabled: () => mocks.channelsEnabled,
}));
vi.mock('@/features/HomeSidebar/hooks', () => ({
  useCreateMenuItems: () => ({
    createAgentMenuItem: () => ({ key: 'newAgent', label: 'newAgent' }),
    createGroupChatMenuItem: () => ({ key: 'legacyGroupChat', label: 'newGroupChat' }),
    isLoading: false,
  }),
}));
vi.mock('@/features/Workspace/useWorkspaceAwareNavigate', () => ({
  useWorkspaceAwareNavigate: () => mocks.navigate,
}));
vi.mock('./SearchContext', () => ({ useMessageSearch: () => ({ query: '', setQuery: vi.fn() }) }));

const menuKeys = () => screen.getAllByRole('button').map((el) => el.textContent);

describe('MessageList Header create menu', () => {
  beforeEach(() => {
    mocks.channelsEnabled = true;
    vi.clearAllMocks();
  });

  it('offers only creating an Agent and a group, the group being a multi-Agent Channel', () => {
    render(<Header />);
    expect(menuKeys()).toEqual(['newAgent', 'newGroupChat']);

    fireEvent.click(screen.getByRole('button', { name: 'newGroupChat' }));
    expect(mocks.openCreateGroupChannel).toHaveBeenCalledOnce();

    mocks.openCreateGroupChannel.mock.calls[0][0]('chn_1');
    expect(mocks.navigate).toHaveBeenCalledWith('/channels/chn_1');
  });

  it('falls back to an Agent group where Channels are off', () => {
    mocks.channelsEnabled = false;
    render(<Header />);
    expect(menuKeys()).toEqual(['newAgent', 'legacyGroupChat']);
  });
});
