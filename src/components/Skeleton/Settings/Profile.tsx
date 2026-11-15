'use client';

import { Block, Flexbox, Icon, Text } from '@lobehub/ui';
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';
import { BriefcaseIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { INTEREST_AREAS } from '@/features/Onboarding/config';
import InsetGroup from '@/features/Settings/profile/features/InsetGroup';
import { useUserStore } from '@/store/user';
import { authSelectors, userProfileSelectors } from '@/store/user/selectors';

import SkeletonBar from '../Bar';
import { useSkeletonText } from './useSkeletonText';

const styles = stylex.create({
  hero: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    padding: '16px',
  },
  row: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '48px',
    paddingBlock: '8px',
    paddingInline: '16px',
  },
  signOut: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '48px',
    paddingInline: '16px',
    color: cssVar.colorError,
  },
});

interface SettingsProfileRowSkeletonProps {
  /** The row's real label; static copy renders as text instead of a bar. */
  label: ReactNode;
  valueWidth?: number;
}

/** An inset-group row: the real label on the left, a bar where the value sits. */
export const SettingsProfileRowSkeleton = ({
  label,
  valueWidth = 160,
}: SettingsProfileRowSkeletonProps) => (
  <div {...stylex.props(styles.row)}>
    {typeof label === 'string' ? <Text>{label}</Text> : label}
    <SkeletonBar height={22} width={valueWidth} />
  </div>
);

/**
 * The interest chips are static copy (the onboarding interest areas plus
 * "Other"), so they render as the same outlined chips the row shows; only the
 * user's selection is unknown and stays unhighlighted.
 */
const InterestsSkeleton = () => {
  const { t, ready } = useTranslation('onboarding');
  const chips = [
    ...INTEREST_AREAS.map(({ icon, key }) => ({ icon, key, label: t(`interests.area.${key}`) })),
    { icon: BriefcaseIcon, key: 'other', label: t('interests.area.other') },
  ];

  return (
    <Flexbox horizontal align={'center'} gap={8} style={{ width: '100%' }} wrap={'wrap'}>
      {chips.map(({ icon, key, label }) => (
        <Block horizontal gap={8} key={key} padding={8} variant={'outlined'}>
          <Icon color={cssVar.colorTextSecondary} icon={icon} size={14} />
          {ready ? (
            <Text fontSize={13} weight={500}>
              {label}
            </Text>
          ) : (
            <SkeletonBar height={13} width={56} />
          )}
        </Block>
      ))}
    </Flexbox>
  );
};

/**
 * The profile tab's inset groups: same captions and row labels as the settled
 * page, with placeholders only for the user's values. Rows the settled page
 * shows conditionally (email, sign out) follow the same conditions.
 */
const SettingsProfileSkeleton = () => {
  const isLogin = useUserStore(authSelectors.isLogin);
  const email = useUserStore(userProfileSelectors.email);
  const text = useSkeletonText('auth');

  return (
    <Flexbox aria-busy data-testid={'settings-profile-skeleton'} gap={24}>
      <InsetGroup footer={text('profile.nameHint', 240, 12)}>
        <div {...stylex.props(styles.hero)}>
          <SkeletonBar height={64} radius={'50%'} width={64} />
          <SkeletonBar height={22} width={160} />
        </div>
      </InsetGroup>
      <InsetGroup
        footer={text('profile.interestsHint', 320, 12)}
        title={text('profile.interests', 64, 12)}
      >
        <Flexbox padding={16}>
          <InterestsSkeleton />
        </Flexbox>
      </InsetGroup>
      <InsetGroup>
        <SettingsProfileRowSkeleton label={text('profile.username', 64, 22)} valueWidth={120} />
        {isLogin && email && (
          <SettingsProfileRowSkeleton label={text('profile.email', 96, 22)} valueWidth={184} />
        )}
      </InsetGroup>
      {isLogin && (
        <InsetGroup>
          <div {...stylex.props(styles.signOut)}>{text('signout', 64, 16)}</div>
        </InsetGroup>
      )}
    </Flexbox>
  );
};

export default SettingsProfileSkeleton;
