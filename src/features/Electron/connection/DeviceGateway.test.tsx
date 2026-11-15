import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useElectronStore } from '@/store/electron';

import DeviceGateway, { OFFLINE_HINT_DELAY_MS } from './DeviceGateway';

const mocks = vi.hoisted(() => ({ connectGateway: vi.fn(async () => {}) }));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@lobechat/electron-client-ipc', () => ({ useWatchBroadcast: vi.fn() }));
vi.mock('@/features/Workspace/useWorkspaceAwareNavigate', () => ({
  useWorkspaceAwareNavigate: () => vi.fn(),
}));

const setStatus = (status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting') =>
  act(() => {
    useElectronStore.setState({ gatewayConnectionStatus: status });
  });

const offlineMark = () => screen.queryByLabelText('gateway.statusDisconnected');

describe('DeviceGateway', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useElectronStore.setState({
      connectGateway: mocks.connectGateway,
      dataSyncConfig: { active: true, storageMode: 'cloud' },
      gatewayConnectionError: undefined,
      gatewayConnectionStatus: 'connecting',
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('shows nothing while the device connects and stays online', () => {
    render(<DeviceGateway />);
    setStatus('connected');
    act(() => vi.advanceTimersByTime(OFFLINE_HINT_DELAY_MS * 2));

    expect(offlineMark()).toBeNull();
  });

  it('shows the offline mark only once the device stays off the gateway', () => {
    render(<DeviceGateway />);
    setStatus('disconnected');

    act(() => vi.advanceTimersByTime(OFFLINE_HINT_DELAY_MS - 1));
    expect(offlineMark()).toBeNull();

    act(() => vi.advanceTimersByTime(1));
    expect(offlineMark()).not.toBeNull();
  });

  it('keeps the mark steady through automatic retries and clears it once online', () => {
    render(<DeviceGateway />);
    setStatus('disconnected');
    act(() => vi.advanceTimersByTime(OFFLINE_HINT_DELAY_MS));

    setStatus('connecting');
    expect(offlineMark()).not.toBeNull();
    setStatus('disconnected');
    expect(offlineMark()).not.toBeNull();

    setStatus('connected');
    expect(offlineMark()).toBeNull();
  });

  it('offers a manual retry with the reason the last attempt failed', () => {
    useElectronStore.setState({ gatewayConnectionError: { code: 'config_unavailable' } });
    render(<DeviceGateway />);
    setStatus('disconnected');
    act(() => vi.advanceTimersByTime(OFFLINE_HINT_DELAY_MS));

    fireEvent.click(offlineMark()!);
    expect(screen.getByText('gateway.error.configUnavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByText('gateway.retry'));

    expect(mocks.connectGateway).toHaveBeenCalledTimes(1);
  });

  it('stays hidden when the desktop is not signed in to a server', () => {
    useElectronStore.setState({ dataSyncConfig: { active: false, storageMode: 'cloud' } });
    render(<DeviceGateway />);
    setStatus('disconnected');
    act(() => vi.advanceTimersByTime(OFFLINE_HINT_DELAY_MS));

    expect(offlineMark()).toBeNull();
  });
});
