import { type ComponentType, createElement } from 'react';

import InterestsPage from '@/features/Settings/profile/interests';
import UsernamePage from '@/features/Settings/profile/username';
import { SettingsTabs } from '@/store/global/initialState';

/**
 * Second-level settings pages, Telegram style: a row on the tab opens one of
 * these at `/settings/<tab>/<sub>`, with a back button to the tab.
 */
const SETTINGS_SUB_PAGES: Partial<Record<string, Record<string, ComponentType>>> = {
  [SettingsTabs.Profile]: { interests: InterestsPage, username: UsernamePage },
};

export const hasSettingsSubPage = (tab: string | undefined, sub: string) =>
  !!(tab && SETTINGS_SUB_PAGES[tab]?.[sub]);

/** The sub page's element, or `null` when the tab has no such page. */
export const renderSettingsSubPage = (tab: string | undefined, sub: string) => {
  const page = tab ? SETTINGS_SUB_PAGES[tab]?.[sub] : undefined;
  return page ? createElement(page) : null;
};

export const getSettingsSubPageUrl = (tab: SettingsTabs, sub: string) => `/settings/${tab}/${sub}`;
