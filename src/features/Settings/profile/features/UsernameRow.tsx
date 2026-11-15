'use client';

import { Text } from '@lobehub/ui';
import { useTranslation } from 'react-i18next';

import { getSettingsSubPageUrl } from '@/features/Settings/features/subPages';
import { SettingsTabs } from '@/store/global/initialState';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import ProfileRow from './ProfileRow';

/** Telegram-style: the row shows the handle and opens its own page to change it. */
const UsernameRow = () => {
  const { t } = useTranslation('auth');
  const username = useUserStore(userProfileSelectors.username);

  return (
    <ProfileRow
      anchor={'profile-username'}
      label={t('profile.username')}
      to={getSettingsSubPageUrl(SettingsTabs.Profile, 'username')}
    >
      <Text ellipsis type={'secondary'}>
        {username ? `@${username}` : t('profile.usernameEmpty')}
      </Text>
    </ProfileRow>
  );
};

export default UsernameRow;
