'use client';

import { useTranslation } from 'react-i18next';

import ChatAppearance from '@/features/Settings/chat-appearance/features/ChatAppearance';
import SubPageFrame from '@/features/Settings/features/inset/SubPageFrame';
import { SettingsTabs } from '@/store/global/initialState';

/** How messages render and behave while streaming, opened from Appearance. */
const AppearanceChatPage = () => {
  const { t } = useTranslation('setting');

  return (
    <SubPageFrame tab={SettingsTabs.Appearance} title={t('settingAppearance.chatDisplay.title')}>
      <ChatAppearance />
    </SubPageFrame>
  );
};

export default AppearanceChatPage;
