import { cleanup, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mapFeatureFlagsEnvToState } from '@/config/featureFlags';
import { SettingsTabs } from '@/store/global/initialState';
import { initServerConfigStore, Provider } from '@/store/serverConfig/store';

import { SettingsGroupKey, useCategory } from './useCategory';

vi.hoisted(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: vi.fn(() => null), removeItem: vi.fn(), setItem: vi.fn() },
  });
});

const renderCategory = (featureFlags: Record<string, boolean> = {}) =>
  renderHook(() => useCategory(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <Provider
        createStore={() =>
          initServerConfigStore({
            featureFlags: { ...mapFeatureFlagsEnvToState({}), ...featureFlags },
            serverConfig: { aiProvider: {}, enableBusinessFeatures: true, telemetry: {} },
          })
        }
      >
        {children}
      </Provider>
    ),
  }).result.current;

afterEach(() => cleanup());

describe('settings useCategory', () => {
  it('lists only the everyday sections, in two groups', () => {
    const groups = renderCategory();

    expect(groups.map((group) => group.key)).toEqual([
      SettingsGroupKey.General,
      SettingsGroupKey.System,
    ]);
    expect(groups[1].items.map((item) => item.key)).toEqual([
      SettingsTabs.Labs,
      SettingsTabs.Advanced,
      SettingsTabs.About,
    ]);
  });

  it('never offers configuration surfaces such as providers, skills or OAuth apps', () => {
    const keys = renderCategory({ showApiKeyManage: true, showProvider: true }).flatMap((group) =>
      group.items.map((item) => item.key),
    );

    for (const hidden of [
      SettingsTabs.Provider,
      SettingsTabs.Skill,
      SettingsTabs.OAuthApps,
      SettingsTabs.APIKey,
      SettingsTabs.Plans,
    ])
      expect(keys).not.toContain(hidden);
  });

  it('hides About when docs are hidden', () => {
    const keys = renderCategory({ hideDocs: true }).flatMap((group) =>
      group.items.map((item) => item.key),
    );

    expect(keys).not.toContain(SettingsTabs.About);
  });
});
