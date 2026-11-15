import { createElement } from 'react';

import { SettingsChunkSkeleton } from '@/components/Skeleton/Settings/Page';
import dynamic from '@/libs/next/dynamic';
import { SettingsTabs } from '@/store/global/initialState';

const loading = (_debugId: string) => () => createElement(SettingsChunkSkeleton);

/**
 * Lobot keeps only the everyday, Telegram-like sections. Configuration surfaces
 * such as providers, skills or OAuth apps are intentionally absent.
 */
export const componentMap = {
  [SettingsTabs.Profile]: dynamic(() => import('../profile'), {
    loading: loading('Settings > Profile'),
  }),
  [SettingsTabs.Appearance]: dynamic(() => import('../appearance'), {
    loading: loading('Settings > Appearance'),
  }),
  [SettingsTabs.Notification]: dynamic(
    () => import('../notification').then((m) => ({ default: m.DesktopNotificationSettings })),
    { loading: loading('Settings > Notification') },
  ),
  [SettingsTabs.Hotkey]: dynamic(() => import('../hotkey'), {
    loading: loading('Settings > Hotkey'),
  }),
  [SettingsTabs.Proxy]: dynamic(() => import('../proxy'), {
    loading: loading('Settings > Proxy'),
  }),
  [SettingsTabs.Labs]: dynamic(() => import('../labs'), {
    loading: loading('Settings > Labs'),
  }),
  [SettingsTabs.Advanced]: dynamic(() => import('../advanced'), {
    loading: loading('Settings > Advanced'),
  }),
  [SettingsTabs.About]: dynamic(() => import('../about'), {
    loading: loading('Settings > About'),
  }),
};
