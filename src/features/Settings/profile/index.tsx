'use client';

import { Flexbox } from '@lobehub/ui';
import { useTranslation } from 'react-i18next';

import ProfileSkeleton from '@/components/Skeleton/Settings/tabs/Profile';
import SettingHeader from '@/features/Settings/features/SettingHeader';
import { useUserStore } from '@/store/user';
import { authSelectors, userProfileSelectors } from '@/store/user/selectors';

import InsetGroup from '../features/inset/InsetGroup';
import EmailRow from './features/EmailRow';
import InterestsRow from './features/InterestsRow';
import ProfileHero from './features/ProfileHero';
import SignOutRow from './features/SignOutRow';
import UsernameRow from './features/UsernameRow';

interface ProfileSettingProps {
  showSettingHeader?: boolean;
}

const ProfileSetting = ({ showSettingHeader = true }: ProfileSettingProps) => {
  const isLogin = useUserStore(authSelectors.isLogin);
  const [userProfile, isUserLoaded] = useUserStore((s) => [
    userProfileSelectors.userProfile(s),
    s.isLoaded,
  ]);
  const isLoading = !isUserLoaded;

  const { t } = useTranslation('auth');

  // Same inset groups the route and chunk fallbacks draw, so the tab never
  // swaps between two differently shaped skeletons.
  if (isLoading)
    return (
      <>
        {showSettingHeader && <SettingHeader title={t('profile.title')} />}
        <ProfileSkeleton.Body />
      </>
    );

  return (
    <>
      {showSettingHeader && <SettingHeader title={t('profile.title')} />}
      {/* Telegram-style inset groups: who you are, what you care about, the account, then sign out.
          Interests and username open their own pages. */}
      <Flexbox gap={24}>
        <ProfileHero />
        <InsetGroup footer={t('profile.interestsHint')}>
          <InterestsRow />
        </InsetGroup>
        <InsetGroup>
          <UsernameRow />
          {isLogin && userProfile?.email && <EmailRow />}
        </InsetGroup>
        {isLogin && (
          <InsetGroup>
            <SignOutRow />
          </InsetGroup>
        )}
      </Flexbox>
    </>
  );
};

export default ProfileSetting;
