'use client';

import { Flexbox, Text } from '@lobehub/ui';
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex';
import * as stylex from '@stylexjs/stylex';
import { type ReactNode } from 'react';

import InsetGroup from '@/features/Settings/features/inset/InsetGroup';
import { useUserStore } from '@/store/user';
import { authSelectors, userProfileSelectors } from '@/store/user/selectors';

import SkeletonBar from '../Bar';
import { useSkeletonText } from './useSkeletonText';

const styles = stylex.create({
  hero: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    paddingBlock: '8px',
    paddingInline: '16px',
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
          <SkeletonBar height={40} radius={'50%'} width={40} />
          <SkeletonBar height={22} width={160} />
        </div>
      </InsetGroup>
      <InsetGroup footer={text('profile.interestsHint', 320, 12)}>
        <SettingsProfileRowSkeleton label={text('profile.interests', 64, 22)} valueWidth={72} />
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
