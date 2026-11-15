'use client';

import { normalizeInterestsForStorage } from '@lobechat/const';
import { Text } from '@lobehub/ui';
import { useTranslation } from 'react-i18next';

import { getSettingsSubPageUrl } from '@/features/Settings/features/subPages';
import { SettingsTabs } from '@/store/global/initialState';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import InsetRow from '../../features/inset/InsetRow';

/** One row with the selection count; the picker opens on its own page. */
const InterestsRow = () => {
  const { t } = useTranslation('auth');
  const interests = useUserStore(userProfileSelectors.interests);
  const count = normalizeInterestsForStorage(interests).length;

  return (
    <InsetRow
      anchor={'profile-interests'}
      label={t('profile.interests')}
      to={getSettingsSubPageUrl(SettingsTabs.Profile, 'interests')}
    >
      <Text ellipsis type={'secondary'}>
        {count > 0 ? t('profile.interestsCount', { count }) : t('profile.interestsNone')}
      </Text>
    </InsetRow>
  );
};

export default InterestsRow;
