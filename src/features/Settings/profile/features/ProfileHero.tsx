'use client';

import * as stylex from '@stylexjs/stylex';
import { useTranslation } from 'react-i18next';

import { SETTINGS_ANCHOR_ROW_ATTR, SettingsSearchAnchor } from '@/features/SettingsSearch/anchor';

import InsetGroup from '../../features/inset/InsetGroup';
import AvatarUpload from './AvatarUpload';
import FullNameInput from './FullNameInput';

const styles = stylex.create({
  name: { flex: '1', minWidth: '0' },
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    paddingBlock: '8px',
    paddingInline: '16px',
  },
});

/** Telegram's edit-profile header: photo and name in one card, with the hint below. */
const ProfileHero = () => {
  const { t } = useTranslation('auth');

  return (
    <InsetGroup footer={t('profile.nameHint')}>
      <div {...stylex.props(styles.row)} {...{ [SETTINGS_ANCHOR_ROW_ATTR]: '' }}>
        <SettingsSearchAnchor id={'profile-avatar'}>
          <AvatarUpload />
        </SettingsSearchAnchor>
        <div {...stylex.props(styles.name)}>
          <SettingsSearchAnchor id={'profile-full-name'} />
          <FullNameInput />
        </div>
      </div>
    </InsetGroup>
  );
};

export default ProfileHero;
