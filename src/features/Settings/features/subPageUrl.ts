import { type SettingsTabs } from '@/store/global/initialState';

/** URL of a second-level settings page, e.g. `/settings/appearance/font`. */
export const getSettingsSubPageUrl = (tab: SettingsTabs, sub: string) => `/settings/${tab}/${sub}`;
