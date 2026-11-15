'use client';

import { useTranslation } from 'react-i18next';

import { SettingsTabs } from '@/store/global/initialState';

import InsetGroup from '../../features/inset/InsetGroup';
import SubPageFrame from '../../features/inset/SubPageFrame';
import InterestsPicker from './InterestsPicker';

/** The interests picker on its own page; each toggle saves, so Back is all it needs. */
const InterestsPage = () => {
  const { t } = useTranslation('auth');

  return (
    <SubPageFrame tab={SettingsTabs.Profile} title={t('profile.interests')}>
      <InsetGroup footer={t('profile.interestsHint')}>
        <InterestsPicker />
      </InsetGroup>
    </SubPageFrame>
  );
};

export default InterestsPage;
