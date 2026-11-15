'use client';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ListHeader } from '@/features/MessageList';

const Header = memo(() => {
  const { t } = useTranslation('common');

  return <ListHeader title={t('tab.setting')} />;
});

Header.displayName = 'SettingsSidebarHeader';

export default Header;
