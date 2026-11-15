import { isDesktop } from '@lobechat/const';
import {
  BellIcon,
  EllipsisIcon,
  EthernetPort,
  FlaskConical,
  Info,
  KeyboardIcon,
  PaletteIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsTabs } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

export enum SettingsGroupKey {
  General = 'general',
  System = 'system',
}

export interface CategoryItem {
  /** Override the navigation URL. When omitted, Body derives the URL from `key`. */
  href?: string;
  icon: any;
  key: SettingsTabs;
  label: string;
}

export interface CategoryGroup {
  items: CategoryItem[];
  key: SettingsGroupKey;
  title: string;
}

/**
 * The settings list column, Telegram-style: the profile card sits above these
 * groups, so Profile itself is not listed. Lobot keeps only everyday sections;
 * configuration surfaces (providers, skills, OAuth apps, …) are not offered.
 */
export const useCategory = () => {
  const { t } = useTranslation('setting');
  const { t: tLabs } = useTranslation('labs');
  const { hideDocs } = useServerConfigStore(featureFlagsSelectors);

  return useMemo<CategoryGroup[]>(() => {
    const generalItems = [
      { icon: PaletteIcon, key: SettingsTabs.Appearance, label: t('tab.appearance') },
      { icon: BellIcon, key: SettingsTabs.Notification, label: t('tab.notification') },
      { icon: KeyboardIcon, key: SettingsTabs.Hotkey, label: t('tab.hotkey') },
      isDesktop && { icon: EthernetPort, key: SettingsTabs.Proxy, label: t('tab.proxy') },
    ].filter(Boolean) as CategoryItem[];

    const systemItems = [
      { icon: FlaskConical, key: SettingsTabs.Labs, label: tLabs('title') },
      { icon: EllipsisIcon, key: SettingsTabs.Advanced, label: t('tab.advanced') },
      !hideDocs && { icon: Info, key: SettingsTabs.About, label: t('tab.about') },
    ].filter(Boolean) as CategoryItem[];

    return [
      { items: generalItems, key: SettingsGroupKey.General, title: t('group.common') },
      { items: systemItems, key: SettingsGroupKey.System, title: t('group.systemDeveloper') },
    ];
  }, [t, tLabs, hideDocs]);
};
