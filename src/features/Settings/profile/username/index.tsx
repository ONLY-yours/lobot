'use client';

import { Button, Input, Text } from '@lobehub/ui';
import { type ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import NavHeader from '@/features/NavHeader';
import BackButton from '@/features/NavPanel/components/BackButton';
import SettingContainer from '@/features/Setting/SettingContainer';
import { getSettingsContainerMaxWidth } from '@/features/Settings/features/ownFrameTabs';
import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { SettingsTabs } from '@/store/global/initialState';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import InsetGroup from '../features/InsetGroup';
import { validateUsername } from './validate';

const PROFILE_URL = `/settings/${SettingsTabs.Profile}`;

/**
 * Telegram's username page: one field, the rules underneath, and Done in the
 * header. Saving returns to the profile; Back or Escape leaves it unchanged.
 */
const UsernamePage = () => {
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation('common');
  const navigate = useWorkspaceAwareNavigate();
  const username = useUserStore(userProfileSelectors.username) || '';
  const updateUsername = useUserStore((s) => s.updateUsername);
  const [value, setValue] = useState(username);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const trimmed = value.trim();
  const dirty = trimmed !== username;

  const goBack = () => navigate(PROFILE_URL, { escape: true });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    // Only flag what the user can already see is wrong; emptiness waits for Done.
    const next = e.target.value.trim();
    setError(next ? (validateUsername(next, t) ?? '') : '');
  };

  const handleDone = async () => {
    if (saving) return;
    if (!dirty) return goBack();

    const validationError = validateUsername(trimmed, t);
    if (validationError) return setError(validationError);

    try {
      setSaving(true);
      setError('');
      await updateUsername(trimmed);
      goBack();
    } catch (err: any) {
      console.error('Failed to update username:', err);
      setError(
        err?.data?.code === 'CONFLICT' || err?.message === 'USERNAME_TAKEN'
          ? t('profile.usernameDuplicate')
          : t('profile.usernameUpdateFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <NavHeader
        left={<BackButton title={tCommon('back')} to={PROFILE_URL} />}
        showTogglePanelButton={false}
        styles={{ center: { alignItems: 'center' } }}
        right={
          <Button disabled={!!error} loading={saving} size={'small'} onClick={handleDone}>
            {t('profile.save')}
          </Button>
        }
      >
        <Text weight={500}>{t('profile.username')}</Text>
      </NavHeader>
      <SettingContainer
        maxWidth={getSettingsContainerMaxWidth(SettingsTabs.Profile)}
        paddingBlock={'24px 128px'}
        paddingInline={24}
        style={{ background: 'transparent' }}
      >
        <InsetGroup
          footer={
            error ? (
              <Text fontSize={12} type={'danger'}>
                {error}
              </Text>
            ) : (
              t('profile.usernameHint')
            )
          }
        >
          <Input
            autoFocus
            aria-invalid={!!error}
            aria-label={t('profile.username')}
            disabled={saving}
            placeholder={t('profile.usernamePlaceholder')}
            prefix={<Text type={'secondary'}>@</Text>}
            style={{ minHeight: 48, paddingInline: 16 }}
            value={value}
            variant={'borderless'}
            onChange={handleChange}
            onPressEnter={handleDone}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                goBack();
              }
            }}
          />
        </InsetGroup>
      </SettingContainer>
    </>
  );
};

export default UsernamePage;
