'use client';

import { Text } from '@lobehub/ui';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import NavHeader from '@/features/NavHeader';
import BackButton from '@/features/NavPanel/components/BackButton';
import SettingContainer from '@/features/Setting/SettingContainer';
import { getSettingsContainerMaxWidth } from '@/features/Settings/features/ownFrameTabs';
import type { SettingsTabs } from '@/store/global/initialState';

export const settingsTabUrl = (tab: SettingsTabs) => `/settings/${tab}`;

interface SubPageFrameProps {
  children: ReactNode;
  /** Header action, e.g. Save */
  right?: ReactNode;
  /** The tab this page belongs to; the back button returns there */
  tab: SettingsTabs;
  title: ReactNode;
}

/**
 * A second-level settings page, Telegram style: back to its tab on the left,
 * the title centred, and the body in the tab's inset column on the window
 * background.
 */
const SubPageFrame = ({ children, right, tab, title }: SubPageFrameProps) => {
  const { t } = useTranslation('common');

  return (
    <>
      <NavHeader
        left={<BackButton title={t('back')} to={settingsTabUrl(tab)} />}
        right={right}
        showTogglePanelButton={false}
        styles={{ center: { alignItems: 'center' } }}
      >
        <Text weight={500}>{title}</Text>
      </NavHeader>
      <SettingContainer
        maxWidth={getSettingsContainerMaxWidth(tab)}
        paddingBlock={'24px 128px'}
        paddingInline={24}
        style={{ background: 'transparent' }}
      >
        {children}
      </SettingContainer>
    </>
  );
};

export default SubPageFrame;
