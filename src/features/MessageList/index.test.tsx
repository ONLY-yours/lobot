import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import MessageListPortal from './index';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/features/NavPanel/NavPanelPortal', () => ({
  NavPanelPortal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@/features/NavPanel/SideBarLayout', () => ({
  default: ({ body, header }: { body: ReactNode; header: ReactNode }) => (
    <>
      {header}
      {body}
    </>
  ),
}));
vi.mock('@/features/HomeSidebar/Body/Agent/ModalProvider', () => ({
  AgentModalProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('./Header', () => ({ default: () => null, ListHeader: () => null }));
vi.mock('./ConversationRow', () => ({ default: () => null }));
vi.mock('@/features/Channels/ChannelList', () => ({
  ChannelSection: () => <div data-testid={'channels'} />,
  default: () => <div data-testid={'channels'} />,
}));
vi.mock('./Body', () => ({ default: () => <div data-testid={'conversations'} /> }));

describe('MessageListPortal', () => {
  // The column used to mount only the Channels section, so no conversation was listed.
  it('lists the conversations and no separate Channels section', () => {
    render(<MessageListPortal />);

    expect(screen.getByTestId('conversations')).toBeInTheDocument();
    expect(screen.queryByTestId('channels')).not.toBeInTheDocument();
  });
});
