'use client';

import { Text } from '@lobehub/ui';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import NavHeader from '@/features/NavHeader';
import BackButton from '@/features/NavPanel/components/BackButton';
import SettingContainer from '@/features/Setting/SettingContainer';
import { getSettingsContainerMaxWidth } from '@/features/Settings/features/ownFrameTabs';
import { SettingsTabs } from '@/store/global/initialState';

export const PROFILE_URL = `/settings/${SettingsTabs.Profile}`;

interface SubPageFrameProps {
  children: ReactNode;
  /** Header action, e.g. Save */
  right?: ReactNode;
  title: ReactNode;
}

/**
 * A profile sub page, Telegram style: back to the profile on the left, the
 * title centred, and the body in the profile's inset column on the window
 * background.
 */
const SubPageFrame = ({ children, right, title }: SubPageFrameProps) => {
  const { t } = useTranslation('common');

  return (
    <>
      <NavHeader
        left={<BackButton title={t('back')} to={PROFILE_URL} />}
        right={right}
        showTogglePanelButton={false}
        styles={{ center: { alignItems: 'center' } }}
      >
        <Text weight={500}>{title}</Text>
      </NavHeader>
      <SettingContainer
        maxWidth={getSettingsContainerMaxWidth(SettingsTabs.Profile)}
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
