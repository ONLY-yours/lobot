'use client';

import { useTranslation } from 'react-i18next';

import SubPageFrame from '@/features/Settings/features/inset/SubPageFrame';
import { SettingsTabs } from '@/store/global/initialState';

import FontSettings from '../features/Font';

/** Interface and code fonts with their fallbacks, opened from the Font row on Appearance. */
const AppearanceFontPage = () => {
  const { t } = useTranslation('setting');

  return (
    <SubPageFrame tab={SettingsTabs.Appearance} title={t('settingAppearance.font.title')}>
      <FontSettings />
    </SubPageFrame>
  );
};

export default AppearanceFontPage;
