import type { EventEmitter } from 'node:events';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GatewayKeepConnected, KEEP_CONNECTED_INTERVAL_MS } from '../gatewayKeepConnected';

const { powerMonitorMock } = vi.hoisted(() => {
  const { EventEmitter: Emitter } = require('node:events');
  return { powerMonitorMock: new Emitter() as EventEmitter };
});

vi.mock('electron', () => ({ powerMonitor: powerMonitorMock }));

const setup = (initial: { offline?: boolean; signedIn?: boolean } = {}) => {
  const state = { offline: initial.offline ?? true, signedIn: initial.signedIn ?? true };
  const connect = vi.fn(async () => {
    state.offline = false;
  });
  const keeper = new GatewayKeepConnected({
    canAutoReconnect: () => state.offline,
    connect,
    isSignedIn: async () => state.signedIn,
  });
  return { connect, keeper, state };
};

describe('GatewayKeepConnected', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    powerMonitorMock.removeAllListeners();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('connects on start when signed in and offline', async () => {
    const { connect, keeper } = setup();

    keeper.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(connect).toHaveBeenCalledTimes(1);
  });

  // Launching offline (or with the server config unreachable) used to stay offline
  // for good: the gateway client only retries sockets it already opened.
  it('keeps retrying on a timer while the device stays offline', async () => {
    const { connect, keeper, state } = setup();
    connect.mockImplementation(async () => {});

    keeper.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(KEEP_CONNECTED_INTERVAL_MS * 2);
    expect(connect).toHaveBeenCalledTimes(3);

    state.offline = false;
    await vi.advanceTimersByTimeAsync(KEEP_CONNECTED_INTERVAL_MS * 2);
    expect(connect).toHaveBeenCalledTimes(3);
  });

  it('reconnects as soon as the machine wakes or unlocks', async () => {
    const { connect, keeper, state } = setup({ offline: false });
    keeper.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(connect).not.toHaveBeenCalled();

    state.offline = true;
    powerMonitorMock.emit('resume');
    await vi.advanceTimersByTimeAsync(0);
    expect(connect).toHaveBeenCalledTimes(1);

    state.offline = true;
    powerMonitorMock.emit('unlock-screen');
    await vi.advanceTimersByTimeAsync(0);
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it('waits for a sign-in instead of connecting without a login', async () => {
    const { connect, keeper, state } = setup({ signedIn: false });

    keeper.start();
    await vi.advanceTimersByTimeAsync(KEEP_CONNECTED_INTERVAL_MS);
    expect(connect).not.toHaveBeenCalled();

    state.signedIn = true;
    await vi.advanceTimersByTimeAsync(KEEP_CONNECTED_INTERVAL_MS);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('stays paused after an explicit disconnect until resumed', async () => {
    const { connect, keeper } = setup();
    keeper.start();
    keeper.pause();

    await vi.advanceTimersByTimeAsync(KEEP_CONNECTED_INTERVAL_MS * 3);
    powerMonitorMock.emit('resume');
    await vi.advanceTimersByTimeAsync(0);
    expect(connect).not.toHaveBeenCalled();

    keeper.resume();
    await vi.advanceTimersByTimeAsync(KEEP_CONNECTED_INTERVAL_MS);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('registers the timer and wake listeners once however often it starts', () => {
    const { keeper } = setup({ offline: false });

    keeper.start();
    keeper.start();

    expect(powerMonitorMock.listenerCount('resume')).toBe(1);
    expect(vi.getTimerCount()).toBe(1);
  });
});
