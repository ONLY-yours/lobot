'use client';

import { useTranslation } from 'react-i18next';

import InsetGroup from '../features/InsetGroup';
import SubPageFrame from '../features/SubPageFrame';
import InterestsPicker from './InterestsPicker';

/** The interests picker on its own page; each toggle saves, so Back is all it needs. */
const InterestsPage = () => {
  const { t } = useTranslation('auth');

  return (
    <SubPageFrame title={t('profile.interests')}>
      <InsetGroup footer={t('profile.interestsHint')}>
        <InterestsPicker />
      </InsetGroup>
    </SubPageFrame>
  );
};

export default InterestsPage;
