'use client';

import { Divider, Flexbox } from '@lobehub/ui';
import { Form } from '@lobehub/ui/form';
import { useTranslation } from 'react-i18next';

import ProfileSkeleton from '@/components/Skeleton/Settings/tabs/Profile';
import SettingHeader from '@/features/Settings/features/SettingHeader';
import { useUserStore } from '@/store/user';
import { authSelectors, userProfileSelectors } from '@/store/user/selectors';

import AvatarRow from './features/AvatarRow';
import EmailRow from './features/EmailRow';
import FullNameRow from './features/FullNameRow';
import InterestsRow from './features/InterestsRow';
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

  // Same account group the route and chunk fallbacks draw, so the tab never
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
      <Form.Group collapsible={false} title={t('profile.account')} variant={'filled'}>
        <Flexbox>
          <AvatarRow />

          <Divider style={{ margin: 0 }} />

          <FullNameRow />

          <Divider style={{ margin: 0 }} />

          <UsernameRow />

          <Divider style={{ margin: 0 }} />

          <InterestsRow />

          {isLogin && userProfile?.email && (
            <>
              <Divider style={{ margin: 0 }} />
              <EmailRow />
            </>
          )}
        </Flexbox>
      </Form.Group>
      {isLogin && (
        <Form.Group collapsible={false} variant={'filled'}>
          <SignOutRow />
        </Form.Group>
      )}
    </>
  );
};

export default ProfileSetting;
