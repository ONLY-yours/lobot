/**
 * @vitest-environment happy-dom
 */
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { BlockedDevice } from './BlockedDevice';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@lobehub/ui', () => ({
  Button: ({ children }: { children?: unknown }) => createElement('button', {}, children as never),
  Flexbox: ({ children, style }: { children?: unknown; style?: object }) =>
    createElement('div', { style }, children as never),
  Text: ({ children }: { children?: unknown }) => createElement('span', {}, children as never),
  usePopoverContext: () => ({ close: () => {} }),
}));
vi.mock('@/features/DeviceManager/getDeviceIcon', () => ({ getDeviceIcon: () => null }));
vi.mock('@/store/channel', () => ({ channelActions: {} }));
vi.mock('./AgentEnvironment', () => ({ openChannelAgentEnvironment: () => {} }));
vi.mock('./CreateChannel/EnvironmentFields', () => ({
  deviceLabel: (device: { hostname: string }) => device.hostname,
}));
vi.mock('@/store/device/useDeviceList', () => ({
  useDeviceList: () => ({
    data: [{ deviceId: 'dev_1', hostname: 'lobehub M4 Pro', online: true }],
    isConfirmed: true,
  }),
}));

const rowIndent = () =>
  Number.parseFloat(
    (screen.getByText('lobehub M4 Pro').closest('[style*="padding-inline-start"]') as HTMLElement)
      .style.paddingInlineStart,
  );

describe('BlockedDevice', () => {
  it('starts a failed reply’s device at the edge, like the failure reason above it', () => {
    render(createElement(BlockedDevice, { channelId: 'chn_1', deviceId: 'dev_1' }));
    expect(rowIndent()).toBe(0);
  });

  it('lines a waiting reply’s device up under the reply name', () => {
    render(createElement(BlockedDevice, { channelId: 'chn_1', deviceId: 'dev_1', waiting: true }));
    expect(rowIndent()).toBe(32);
  });
});
