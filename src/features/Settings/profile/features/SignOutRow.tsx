'use client';

import { Button } from '@lobehub/ui';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSignOut } from '@/hooks/useSignOut';

import ProfileRow from './ProfileRow';

/** Sign-out lives on the profile page now that the avatar tab opens Settings directly. */
const SignOutRow = () => {
  const { t } = useTranslation('auth');
  const signOut = useSignOut();
  const [loading, setLoading] = useState(false);

  return (
    <ProfileRow
      anchor={'profile-sign-out'}
      label={t('signout')}
      action={
        <Button
          danger
          icon={LogOut}
          loading={loading}
          onClick={async () => {
            setLoading(true);
            try {
              await signOut();
            } finally {
              setLoading(false);
            }
          }}
        >
          {t('signout')}
        </Button>
      }
    />
  );
};

export default SignOutRow;
